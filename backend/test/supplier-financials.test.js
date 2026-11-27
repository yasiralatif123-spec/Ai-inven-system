const request = require("supertest");
const app = require("../src/app");
const Supplier = require("../src/models/Supplier");
const Purchase = require("../src/models/Purchase");
const { createBusiness, createUser } = require("./helpers/auth");
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
} = require("./helpers/test-db");
const {
  recalculateSupplierFinancials,
} = require("../src/utils/financials");

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

async function createProduct(overrides = {}) {
  const response = await request(app).post("/api/products").send({
    title: "Supplier Widget",
    sku: `SFIN-${randomSuffix().toUpperCase()}`,
    category: "Test",
    brand: "Test Brand",
    openingStock: 0,
    reorderThreshold: 5,
    priceUnit: "Piece",
    uom: "Piece",
    purchasePrice: 10,
    wholesalePrice: 20,
    retailPrice: 30,
    ...overrides,
  });
  expect(response.status).toBe(201);
  return response.body.product;
}

function supplierPayload(overrides = {}) {
  return {
    name: `Supplier ${randomSuffix()}`,
    contactPerson: "Contact",
    phone: `+92 300${Math.floor(1000000 + Math.random() * 9000000)}`,
    address: "Test Address",
    paymentTerms: "net-30",
    openingBalance: 100,
    ...overrides,
  };
}

async function createSupplier(overrides = {}) {
  const response = await request(app).post("/api/suppliers").send(supplierPayload(overrides));
  expect(response.status).toBe(201);
  return response.body.supplier;
}

function item(product, overrides = {}) {
  return {
    name: product.title,
    sku: product.sku,
    productId: String(product._id),
    quantity: 2,
    unit: "Piece",
    unitPrice: 999, // Ignored: catalog purchase price is authoritative.
    discount: 0,
    taxRate: 0,
    ...overrides,
  };
}

function purchasePayload(supplier, items, overrides = {}) {
  return {
    supplierId: String(supplier._id),
    purchaseDate: "2026-01-01",
    expectedDelivery: "2026-01-05",
    invoiceNumber: `INV-${randomSuffix()}`,
    status: "Draft",
    freight: 0,
    paymentAmount: 0,
    items,
    ...overrides,
  };
}

async function createPurchase(supplier, product, overrides = {}) {
  const response = await request(app)
    .post("/api/purchases")
    .send(purchasePayload(supplier, [item(product)], overrides));
  expect(response.status).toBe(201);
  return response.body.purchase;
}

async function supplierFromDb(id) {
  const supplier = await Supplier.findById(id).lean();
  expect(supplier).not.toBeNull();
  return supplier;
}

describe("supplier financial integrity", () => {
  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  test("creating a purchase updates the correct supplier's stored financial summary", async () => {
    const product = await createProduct();
    const supplier = await createSupplier();
    const other = await createSupplier();

    await createPurchase(supplier, product);

    const saved = await supplierFromDb(supplier._id);
    expect(saved.totalPurchases).toBe(20);
    expect(saved.outstanding).toBe(120);
    expect(saved.lastPurchaseAt).toBeInstanceOf(Date);
    expect(saved.payableNote).toBe("Net 30d");
    expect(saved.payableTone).toBe("danger");

    const untouched = await supplierFromDb(other._id);
    expect(untouched.totalPurchases).toBe(0);
    expect(untouched.outstanding).toBe(100);
    expect(untouched.lastPurchaseAt).toBeNull();
  });

  test("a partial payment does not treat the full purchase total as received", async () => {
    const product = await createProduct();
    const supplier = await createSupplier({ openingBalance: 0 });
    const purchase = await createPurchase(supplier, product, { paymentAmount: 5 });

    expect(purchase.financials.total).toBe(20);
    expect(purchase.paidAmount).toBe(5);

    let saved = await supplierFromDb(supplier._id);
    expect(saved.totalPurchases).toBe(20);
    expect(saved.outstanding).toBe(15);

    const paid = await request(app)
      .post(`/api/purchases/${purchase._id}/payment`)
      .send({ amount: 10, method: "Cash" });
    expect(paid.status).toBe(200);

    saved = await supplierFromDb(supplier._id);
    expect(saved.outstanding).toBe(5);
    expect(saved.totalPurchases).toBe(20);
  });

  test("multiple purchases calculate aggregate values correctly", async () => {
    const product = await createProduct();
    const supplier = await createSupplier({ openingBalance: 50 });

    await createPurchase(supplier, product, {
      items: [item(product, { quantity: 3 })],
    });
    await createPurchase(supplier, product, {
      paymentAmount: 10,
      items: [item(product, { quantity: 4 })],
    });

    const saved = await supplierFromDb(supplier._id);
    expect(saved.totalPurchases).toBe(70);
    expect(saved.outstanding).toBe(110); // 50 + 30 + (40 - 10)
  });

  test("editing a purchase replaces its previous contribution", async () => {
    const product = await createProduct();
    const supplier = await createSupplier({ openingBalance: 0 });
    const purchase = await createPurchase(supplier, product);

    const increased = await request(app)
      .put(`/api/purchases/${purchase._id}`)
      .send(purchasePayload(supplier, [item(product, { quantity: 5 })]));
    expect(increased.status).toBe(200);
    let saved = await supplierFromDb(supplier._id);
    expect(saved.totalPurchases).toBe(50);
    expect(saved.outstanding).toBe(50);

    const decreased = await request(app)
      .put(`/api/purchases/${purchase._id}`)
      .send(purchasePayload(supplier, [item(product, { quantity: 1 })]));
    expect(decreased.status).toBe(200);
    saved = await supplierFromDb(supplier._id);
    expect(saved.totalPurchases).toBe(10);
    expect(saved.outstanding).toBe(10);
    expect(await Purchase.countDocuments()).toBe(1);
  });

  test("receiving a purchase does not double-count supplier financials", async () => {
    const product = await createProduct();
    const supplier = await createSupplier();
    const purchase = await createPurchase(supplier, product);

    const before = await supplierFromDb(supplier._id);
    const received = await request(app)
      .post(`/api/purchases/${purchase._id}/receive`)
      .send({ reference: "GRN-1", items: [{ itemIndex: 0, receivedQuantity: 2 }] });
    expect(received.status).toBe(200);

    const after = await supplierFromDb(supplier._id);
    expect(after.totalPurchases).toBe(before.totalPurchases);
    expect(after.outstanding).toBe(before.outstanding);

    const repeated = await request(app)
      .post(`/api/purchases/${purchase._id}/receive`)
      .send({ reference: "GRN-1", items: [{ itemIndex: 0, receivedQuantity: 2 }] });
    expect(repeated.status).toBe(200);
    const repeatedAfter = await supplierFromDb(supplier._id);
    expect(repeatedAfter.totalPurchases).toBe(20);
    expect(repeatedAfter.outstanding).toBe(120);
  });

  test("cancelling and deleting a purchase reverse its financial contribution", async () => {
    const product = await createProduct();
    const supplier = await createSupplier();
    const purchase = await createPurchase(supplier, product);

    const cancelled = await request(app)
      .patch(`/api/purchases/${purchase._id}/status`)
      .send({ status: "Cancelled" });
    expect(cancelled.status).toBe(200);

    let saved = await supplierFromDb(supplier._id);
    expect(saved.totalPurchases).toBe(0);
    expect(saved.outstanding).toBe(100);
    // The opening balance is still payable, so terms remain displayed.
    expect(saved.payableNote).toBe("Net 30d");
    expect(saved.payableTone).toBe("danger");

    const repeated = await request(app)
      .patch(`/api/purchases/${purchase._id}/status`)
      .send({ status: "Cancelled" });
    expect(repeated.status).toBe(200);
    saved = await supplierFromDb(supplier._id);
    expect(saved.totalPurchases).toBe(0);
    expect(saved.outstanding).toBe(100);

    const deleted = await request(app).delete(`/api/purchases/${purchase._id}`);
    expect(deleted.status).toBe(200);
    saved = await supplierFromDb(supplier._id);
    expect(saved.totalPurchases).toBe(0);
    expect(saved.outstanding).toBe(100);
    expect(saved.lastPurchaseAt).toBeNull();
  });

  test("deleting an active purchase leaves no stale supplier totals", async () => {
    const product = await createProduct();
    const supplier = await createSupplier();
    const purchase = await createPurchase(supplier, product, { paymentAmount: 5 });

    const deleted = await request(app).delete(`/api/purchases/${purchase._id}`);
    expect(deleted.status).toBe(200);

    const saved = await supplierFromDb(supplier._id);
    expect(saved.totalPurchases).toBe(0);
    expect(saved.outstanding).toBe(100);
    expect(await Purchase.countDocuments()).toBe(0);
  });

  test("repeated valid status updates never double-count the same purchase", async () => {
    const product = await createProduct();
    const supplier = await createSupplier();
    const purchase = await createPurchase(supplier, product);

    for (const status of ["Ordered", "Ordered", "Ordered"]) {
      const response = await request(app)
        .patch(`/api/purchases/${purchase._id}/status`)
        .send({ status });
      expect(response.status).toBe(200);
    }

    const saved = await supplierFromDb(supplier._id);
    expect(saved.totalPurchases).toBe(20);
    expect(saved.outstanding).toBe(120);
  });

  test("a purchase without a valid supplier does not corrupt another supplier", async () => {
    const product = await createProduct();
    const supplier = await createSupplier();
    const before = await supplierFromDb(supplier._id);
    const missingId = String(supplier._id).replace(/.$/, supplier._id.toString().endsWith("0") ? "1" : "0");

    const response = await request(app)
      .post("/api/purchases")
      .send(purchasePayload({ _id: missingId }, [item(product)]));
    expect(response.status).toBe(400);

    const after = await supplierFromDb(supplier._id);
    expect(after.totalPurchases).toBe(before.totalPurchases);
    expect(after.outstanding).toBe(before.outstanding);

    const direct = await recalculateSupplierFinancials({
      supplierId: missingId,
    });
    expect(direct).toBeNull();
  });

  test("supplier profile and list return the same financial values as the database", async () => {
    const product = await createProduct({ purchasePrice: 10.25 });
    const supplier = await createSupplier({ openingBalance: 25.5 });
    await createPurchase(supplier, product, {
      items: [item(product, { quantity: 3 })],
    });

    const saved = await supplierFromDb(supplier._id);
    expect(saved.totalPurchases).toBe(30.75);
    expect(saved.outstanding).toBe(56.25);

    const list = await request(app).get("/api/suppliers");
    expect(list.status).toBe(200);
    const listRow = list.body.suppliers.find((row) => row._id === String(supplier._id));
    expect(listRow).toMatchObject({
      totalPurchases: saved.totalPurchases,
      outstanding: saved.outstanding,
    });

    const detail = await request(app).get(`/api/suppliers/${supplier._id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.supplier).toMatchObject({
      totalPurchases: saved.totalPurchases,
      outstanding: saved.outstanding,
    });
  });

  test("a zero-value purchase is rejected and does not change supplier financials", async () => {
    const product = await createProduct({ purchasePrice: 0 });
    const supplier = await createSupplier();
    const before = await supplierFromDb(supplier._id);

    const response = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, [item(product)]));
    expect(response.status).toBe(400);

    const after = await supplierFromDb(supplier._id);
    expect(after.totalPurchases).toBe(before.totalPurchases);
    expect(after.outstanding).toBe(before.outstanding);
  });

  test("concurrent supplier recalculations do not overwrite a newer ledger state", async () => {
    const product = await createProduct();
    const supplier = await createSupplier({ openingBalance: 0 });
    await createPurchase(supplier, product);

    const originalAggregate = Purchase.aggregate;
    let callCount = 0;
    let signalFirstArrived;
    let signalSecondArrived;
    let release;
    const firstArrived = new Promise((resolve) => {
      signalFirstArrived = resolve;
    });
    const secondArrived = new Promise((resolve) => {
      signalSecondArrived = resolve;
    });
    const barrier = new Promise((resolve) => {
      release = resolve;
    });
    const spy = jest.spyOn(Purchase, "aggregate").mockImplementation((pipeline) =>
      originalAggregate.call(Purchase, pipeline).then(async (result) => {
        callCount += 1;
        if (callCount === 1) {
          signalFirstArrived();
          await barrier;
        } else {
          signalSecondArrived();
        }
        return result;
      })
    );

    let timeoutId;
    try {
      const first = recalculateSupplierFinancials({ supplierId: supplier._id });
      await firstArrived;
      const second = recalculateSupplierFinancials({ supplierId: supplier._id });
      await Promise.race([
        secondArrived,
        new Promise((resolve) => {
          timeoutId = setTimeout(resolve, 500);
        }),
      ]);

      // Commit another purchase after the first recomputation read the ledger.
      await Purchase.create({
        purchaseNumber: "PO-CONC-REVIEW",
        supplier: { id: String(supplier._id), name: supplier.name },
        purchaseDate: new Date("2026-02-01"),
        expectedDelivery: new Date("2026-02-05"),
        items: [
          {
            name: product.title,
            quantity: 1,
            unitPrice: 20,
            lineTotal: 20,
          },
        ],
        financials: { subtotal: 20, tax: 0, total: 20 },
        paidAmount: 0,
        status: "Ordered",
      });
      release();
      await Promise.all([first, second]);
    } finally {
      clearTimeout(timeoutId);
      spy.mockRestore();
    }

    const saved = await supplierFromDb(supplier._id);
    expect(saved).toMatchObject({ totalPurchases: 40, outstanding: 40 });
  });

  test("a failed supplier recalculation rolls back a plain status update", async () => {
    const product = await createProduct();
    const supplier = await createSupplier({ openingBalance: 0 });
    const purchase = await createPurchase(supplier, product);

    const originalUpdateOne = Supplier.updateOne;
    const summaryWriteSpy = jest
      .spyOn(Supplier, "updateOne")
      .mockImplementationOnce(() => {
        throw new Error("simulated supplier summary write failure");
      })
      .mockImplementation((...args) => originalUpdateOne.apply(Supplier, args));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      const response = await request(app)
        .patch(`/api/purchases/${purchase._id}/status`)
        .send({ status: "Ordered" });
      expect(response.status).toBe(500);
    } finally {
      consoleSpy.mockRestore();
      summaryWriteSpy.mockRestore();
    }

    const savedPurchase = await Purchase.findById(purchase._id).lean();
    const savedSupplier = await supplierFromDb(supplier._id);
    expect(savedPurchase.status).toBe("Draft");
    expect(savedSupplier).toMatchObject({
      totalPurchases: 20,
      outstanding: 20,
      payableNote: "Net 30d",
      payableTone: "danger",
    });
  });

  describe("tenant isolation", () => {
    const previousAuth = process.env.AUTH_ENFORCEMENT;
    const previousTenant = process.env.TENANT_ENFORCEMENT;

    function cookieHeader(response) {
      const cookies = response.headers["set-cookie"] || [];
      return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
    }

    async function loginAs(email) {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "Password123!" });
      expect(response.status).toBe(200);
      return cookieHeader(response);
    }

    beforeAll(async () => {
      process.env.AUTH_ENFORCEMENT = "true";
      process.env.TENANT_ENFORCEMENT = "true";
    });

    afterAll(async () => {
      process.env.AUTH_ENFORCEMENT = previousAuth;
      process.env.TENANT_ENFORCEMENT = previousTenant;
    });

    test("a supplier belonging to another tenant cannot be updated", async () => {
      const businessA = await createBusiness({ name: "SupFin A", slug: "supfin-a" });
      const businessB = await createBusiness({ name: "SupFin B", slug: "supfin-b" });
      await createUser({ business: businessA, email: "supfin-a@example.com", role: "owner" });
      await createUser({ business: businessB, email: "supfin-b@example.com", role: "owner" });
      const cookieA = await loginAs("supfin-a@example.com");
      const cookieB = await loginAs("supfin-b@example.com");

      const createdB = await request(app)
        .post("/api/suppliers")
        .set("Cookie", cookieB)
        .send(supplierPayload({ name: "Tenant B Supplier" }));
      expect(createdB.status).toBe(201);
      const supplierB = createdB.body.supplier;

      const createdProduct = await request(app)
        .post("/api/products")
        .set("Cookie", cookieA)
        .send({
          title: "Tenant A Product",
          sku: `SFIN-T-${randomSuffix()}`,
          category: "Test",
          brand: "Test",
          openingStock: 50,
          reorderThreshold: 5,
          wholesalePrice: 20,
          purchasePrice: 10,
        });
      expect(createdProduct.status).toBe(201);

      const crossTenant = await request(app)
        .post("/api/purchases")
        .set("Cookie", cookieA)
        .send(
          purchasePayload(supplierB, [item(createdProduct.body.product)])
        );
      expect(crossTenant.status).toBe(400);

      const unchanged = await supplierFromDb(supplierB._id);
      expect(unchanged.totalPurchases).toBe(0);
      expect(unchanged.outstanding).toBe(100);

      const direct = await recalculateSupplierFinancials({
        supplierId: supplierB._id,
        businessId: businessA._id,
      });
      expect(direct).toBeNull();
      expect(await supplierFromDb(supplierB._id)).toMatchObject({
        totalPurchases: 0,
        outstanding: 100,
      });
    });
  });
});
