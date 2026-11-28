const request = require("supertest");
const app = require("../src/app");
const Product = require("../src/models/Product");
const Supplier = require("../src/models/Supplier");
const Customer = require("../src/models/Customer");
const SaleOrder = require("../src/models/SaleOrder");
const Purchase = require("../src/models/Purchase");
const StockMovement = require("../src/models/StockMovement");
const RefreshSession = require("../src/models/RefreshSession");
const { createBusiness, createUser } = require("./helpers/auth");
const { connectTestDB, clearTestDB, disconnectTestDB } = require("./helpers/test-db");
const { seedCustomer } = require("./helpers/customers");

let defaultCustomer = null;

function randomSuffix(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function cookieHeader(response) {
  const cookies = response.headers["set-cookie"] || [];
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function loginAs(email, password = "Password123!") {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  return cookieHeader(response);
}

async function seedProduct({ openingStock = 100, uom = "Piece", overrides = {} } = {}) {
  return Product.create({
    title: "Lifecycle Widget",
    sku: randomSuffix("LIFE"),
    category: "Test",
    brand: "Test",
    reorderThreshold: 5,
    priceUnit: "Piece",
    uom,
    purchasePrice: 10,
    wholesalePrice: 20,
    retailPrice: 30,
    openingStock,
    ...overrides,
  });
}

async function seedSupplier() {
  return Supplier.create({
    supplierCode: randomSuffix("SUP"),
    name: "Lifecycle Supplier",
    contactPerson: "Contact",
    phone: "+92 3001234567",
    address: "Address",
    paymentTerms: "net-15",
  });
}

function salePayload(product, quantity, overrides = {}) {
  const customerRef = defaultCustomer || { name: "Walk-in Customer", phone: "+92 3001234567" };
  return {
    ...(defaultCustomer ? { customerId: String(defaultCustomer._id) } : {}),
    customer: customerRef.name,
    phone: customerRef.phone,
    paymentStatus: "unpaid",
    paymentMethod: "Cash",
    status: "Pending Approval",
    items: [
      {
        name: product.title,
        sku: product.sku,
        productId: String(product._id),
        quantity,
        unitLabel: "Piece",
        unitPrice: product.wholesalePrice,
      },
    ],
    discount: 0,
    freight: 0,
    ...overrides,
  };
}

function purchaseItem(product, quantity, overrides = {}) {
  return {
    name: product.title,
    sku: product.sku,
    productId: String(product._id),
    quantity,
    unit: "Piece",
    unitPrice: product.purchasePrice,
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
    invoiceNumber: randomSuffix("INV"),
    status: "Draft",
    freight: 0,
    items,
    ...overrides,
  };
}

async function stockOf(productId) {
  const product = await Product.findById(productId).lean();
  return Number(product?.openingStock || 0);
}

async function movementsFor(productId, extra = {}) {
  return StockMovement.find({ product: productId, ...extra }).lean();
}

async function createApiProduct(cookie, openingStock = 100) {
  const payload = {
    title: "Tenant Widget",
    sku: randomSuffix("TEN"),
    category: "Test",
    brand: "Test",
    reorderThreshold: 5,
    priceUnit: "Piece",
    uom: "Piece",
    purchasePrice: 10,
    wholesalePrice: 20,
    retailPrice: 30,
    openingStock,
  };
  const response = await request(app).post("/api/products").set("Cookie", cookie).send(payload);
  expect(response.status).toBe(201);
  return response.body.product;
}

async function createApiSupplier(cookie) {
  const payload = {
    name: "Tenant Supplier",
    contactPerson: "Contact",
    phone: "+92 3001234567",
    address: "Address",
    paymentTerms: "net-15",
  };
  const response = await request(app).post("/api/suppliers").set("Cookie", cookie).send(payload);
  expect(response.status).toBe(201);
  return response.body.supplier;
}

describe("Phase 4 - sale lifecycle integrity", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  beforeEach(async () => {
    defaultCustomer = await seedCustomer();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  test("invalid backwards sale transitions are rejected and persisted status is unchanged", async () => {
    const product = await seedProduct();
    const created = await request(app)
      .post("/api/sale-orders")
      .send(salePayload(product, 2, { status: "Delivered" }));
    expect(created.status).toBe(201);

    const rejected = await request(app)
      .patch(`/api/sale-orders/${created.body.order._id}/status`)
      .send({ status: "Processing" });
    expect(rejected.status).toBe(400);

    const saved = await SaleOrder.findById(created.body.order._id).lean();
    expect(saved.status).toBe("Delivered");
    expect(await stockOf(product._id)).toBe(98);
  });

  test("Credit Hold cannot jump directly to Delivered", async () => {
    const product = await seedProduct();
    const created = await request(app)
      .post("/api/sale-orders")
      .send(salePayload(product, 1, { status: "Credit Hold" }));
    expect(created.status).toBe(201);

    const rejected = await request(app)
      .patch(`/api/sale-orders/${created.body.order._id}/status`)
      .send({ status: "Delivered" });
    expect(rejected.status).toBe(400);

    const saved = await SaleOrder.findById(created.body.order._id).lean();
    expect(saved.status).toBe("Credit Hold");
  });

  test("forward progression including Pending Approval to Delivered remains valid", async () => {
    const product = await seedProduct();
    const created = await request(app).post("/api/sale-orders").send(salePayload(product, 1));

    const advanced = await request(app)
      .patch(`/api/sale-orders/${created.body.order._id}/status`)
      .send({ status: "Delivered" });
    expect(advanced.status).toBe(200);
    expect((await SaleOrder.findById(created.body.order._id).lean()).status).toBe("Delivered");
  });

  test("deleting a Delivered sale is blocked and preserves history and stock", async () => {
    const product = await seedProduct();
    const created = await request(app)
      .post("/api/sale-orders")
      .send(salePayload(product, 4, { status: "Delivered" }));
    expect(created.status).toBe(201);

    const deleted = await request(app).delete(`/api/sale-orders/${created.body.order._id}`);
    expect(deleted.status).toBe(400);

    expect(await SaleOrder.findById(created.body.order._id).lean()).not.toBeNull();
    expect(await stockOf(product._id)).toBe(96);
    expect(await movementsFor(product._id, { direction: "in" })).toHaveLength(0);
  });

  test("amountReceived greater than total is rejected", async () => {
    const product = await seedProduct();
    const response = await request(app)
      .post("/api/sale-orders")
      .send(
        salePayload(product, 2, {
          paymentStatus: "partial",
          amountReceived: 999,
        })
      );
    expect(response.status).toBe(400);
    expect(await SaleOrder.countDocuments()).toBe(0);
    expect(await stockOf(product._id)).toBe(100);
    expect(await StockMovement.countDocuments()).toBe(0);
  });

  test("sale stock aggregation uses resolved productId not submitted SKU", async () => {
    const product = await seedProduct({ openingStock: 10 });
    const payload = salePayload(product, 3);
    payload.items[0].sku = "CONFLICTING-SKU";

    const created = await request(app).post("/api/sale-orders").send(payload);
    expect(created.status).toBe(201);
    expect(String(created.body.order.items[0].productId)).toBe(String(product._id));

    expect(await stockOf(product._id)).toBe(7);
    const movements = await movementsFor(product._id, { type: "sale", direction: "out" });
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ previousStock: 10, newStock: 7, quantity: 3 });
  });

  test("duplicate sale payment replay succeeds even when summary refresh fails", async () => {
    const product = await seedProduct();
    const created = await request(app).post("/api/sale-orders").send(salePayload(product, 2));
    const url = `/api/sale-orders/${created.body.order._id}/payment`;

    const first = await request(app)
      .post(url)
      .send({ amount: 5, method: "Cash", idempotencyKey: "phase4-sale-replay" });
    expect(first.status).toBe(200);

    const originalUpdateOne = Customer.updateOne;
    const summarySpy = jest
      .spyOn(Customer, "updateOne")
      .mockImplementationOnce(() => {
        throw new Error("simulated summary refresh failure");
      })
      .mockImplementation((...args) => originalUpdateOne.apply(Customer, args));

    try {
      const replay = await request(app)
        .post(url)
        .send({ amount: 5, method: "Cash", idempotencyKey: "phase4-sale-replay" });
      expect(replay.status).toBe(200);
    } finally {
      summarySpy.mockRestore();
    }

    const saved = await SaleOrder.findById(created.body.order._id).lean();
    expect(saved.payments).toHaveLength(1);
    expect(saved.financials.paid).toBe(5);
  });
});

describe("Phase 4 - purchase lifecycle integrity", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  test("received purchase items cannot be removed", async () => {
    const supplier = await seedSupplier();
    const productA = await seedProduct({ openingStock: 10 });
    const productB = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(
        purchasePayload(supplier, [
          purchaseItem(productA, 2),
          purchaseItem(productB, 3),
        ], { status: "Received" })
      );
    expect(created.status).toBe(201);
    const firstItem = created.body.purchase.items[0];

    const rejected = await request(app)
      .put(`/api/purchases/${created.body.purchase._id}`)
      .send(
        purchasePayload(supplier, [
          { ...purchaseItem(productA, 2), _id: firstItem._id },
        ], { status: "Received" })
      );
    expect(rejected.status).toBe(400);

    expect(await stockOf(productB._id)).toBe(13);
    const saved = await Purchase.findById(created.body.purchase._id).lean();
    expect(saved.items).toHaveLength(2);
    expect(saved.items[1].receipts).toHaveLength(1);
  });

  test("received quantity cannot be reduced below the recorded receipt", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, [purchaseItem(product, 3)], { status: "Received" }));
    expect(created.status).toBe(201);

    const rejected = await request(app)
      .put(`/api/purchases/${created.body.purchase._id}`)
      .send(
        purchasePayload(supplier, [purchaseItem(product, 1)], { status: "Received" })
      );
    expect(rejected.status).toBe(400);

    expect(await stockOf(product._id)).toBe(13);
    const saved = await Purchase.findById(created.body.purchase._id).lean();
    expect(saved.items[0].receivedQuantity).toBe(3);
    expect(saved.items[0].receivedBaseQuantity).toBe(3);
  });

  test("invalid backwards purchase transitions are rejected", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct();
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, [purchaseItem(product, 2)], { status: "Ordered" }));
    expect(created.status).toBe(201);

    const rejected = await request(app)
      .patch(`/api/purchases/${created.body.purchase._id}/status`)
      .send({ status: "Draft" });
    expect(rejected.status).toBe(400);

    const saved = await Purchase.findById(created.body.purchase._id).lean();
    expect(saved.status).toBe("Ordered");
    expect(await stockOf(product._id)).toBe(100);
  });

  test("duplicate purchase payment replay succeeds even when summary refresh fails", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct();
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, [purchaseItem(product, 2)]));
    expect(created.status).toBe(201);
    const url = `/api/purchases/${created.body.purchase._id}/payment`;

    const first = await request(app)
      .post(url)
      .send({ amount: 5, method: "Cash", idempotencyKey: "phase4-purchase-replay" });
    expect(first.status).toBe(200);

    const originalUpdateOne = Supplier.updateOne;
    const summarySpy = jest
      .spyOn(Supplier, "updateOne")
      .mockImplementationOnce(() => {
        throw new Error("simulated summary refresh failure");
      })
      .mockImplementation((...args) => originalUpdateOne.apply(Supplier, args));

    try {
      const replay = await request(app)
        .post(url)
        .send({ amount: 5, method: "Cash", idempotencyKey: "phase4-purchase-replay" });
      expect(replay.status).toBe(200);
    } finally {
      summarySpy.mockRestore();
    }

    const saved = await Purchase.findById(created.body.purchase._id).lean();
    expect(saved.payments).toHaveLength(1);
    expect(saved.paidAmount).toBe(5);
  });
});

describe("Phase 4 - lifecycle authorization and tenant isolation", () => {
  const previousAuth = process.env.AUTH_ENFORCEMENT;
  const previousTenant = process.env.TENANT_ENFORCEMENT;

  beforeAll(async () => {
    process.env.AUTH_ENFORCEMENT = "true";
    process.env.TENANT_ENFORCEMENT = "true";
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    process.env.AUTH_ENFORCEMENT = previousAuth;
    process.env.TENANT_ENFORCEMENT = previousTenant;
    await disconnectTestDB();
  });

  async function seedAuth() {
    const businessA = await createBusiness({ name: "Auth Biz A", slug: "auth-biz-a" });
    const businessB = await createBusiness({ name: "Auth Biz B", slug: "auth-biz-b" });
    await createUser({ business: businessA, email: "owner-a@example.com", role: "owner", name: "Owner A" });
    await createUser({ business: businessA, email: "user-a@example.com", role: "user", name: "User A" });
    await createUser({ business: businessB, email: "owner-b@example.com", role: "owner", name: "Owner B" });
    return {
      businessA,
      businessB,
      ownerA: await loginAs("owner-a@example.com"),
      userA: await loginAs("user-a@example.com"),
      ownerB: await loginAs("owner-b@example.com"),
    };
  }

  test("user-role mutations are rejected with 403 while owners can mutate", async () => {
    const { businessA, ownerA, userA } = await seedAuth();
    const product = await createApiProduct(ownerA);
    const supplier = await createApiSupplier(ownerA);
    const customerA = await seedCustomer({ businessId: businessA._id });
    const saleForA = {
      customerId: String(customerA._id),
      customer: customerA.name,
      phone: customerA.phone,
    };

    const saleAsUser = await request(app)
      .post("/api/sale-orders")
      .set("Cookie", userA)
      .send(salePayload(product, 1, saleForA));
    expect(saleAsUser.status).toBe(403);

    const purchaseAsUser = await request(app)
      .post("/api/purchases")
      .set("Cookie", userA)
      .send(purchasePayload(supplier, [purchaseItem(product, 1)]));
    expect(purchaseAsUser.status).toBe(403);

    const saleAsOwner = await request(app)
      .post("/api/sale-orders")
      .set("Cookie", ownerA)
      .send(salePayload(product, 1, saleForA));
    expect(saleAsOwner.status).toBe(201);
  });

  test("cross-tenant lifecycle mutations are rejected and leave records unchanged", async () => {
    const { businessB, ownerA, ownerB } = await seedAuth();
    const productB = await createApiProduct(ownerB);
    const supplierB = await createApiSupplier(ownerB);
    const customerB = await seedCustomer({ businessId: businessB._id });

    const saleB = await request(app)
      .post("/api/sale-orders")
      .set("Cookie", ownerB)
      .send(
        salePayload(productB, 2, {
          customerId: String(customerB._id),
          customer: customerB.name,
          phone: customerB.phone,
        })
      );
    expect(saleB.status).toBe(201);
    const purchaseB = await request(app)
      .post("/api/purchases")
      .set("Cookie", ownerB)
      .send(purchasePayload(supplierB, [purchaseItem(productB, 2)]));
    expect(purchaseB.status).toBe(201);
    const stockBefore = await stockOf(productB._id);

    const cancelSale = await request(app)
      .patch(`/api/sale-orders/${saleB.body.order._id}/status`)
      .set("Cookie", ownerA)
      .send({ status: "Cancelled" });
    expect(cancelSale.status).toBe(404);

    const receivePurchase = await request(app)
      .post(`/api/purchases/${purchaseB.body.purchase._id}/receive`)
      .set("Cookie", ownerA)
      .send({ items: [{ productId: String(productB._id), receivedQuantity: 2 }] });
    expect(receivePurchase.status).toBe(404);

    expect((await SaleOrder.findById(saleB.body.order._id).lean()).status).toBe("Pending Approval");
    const savedPurchase = await Purchase.findById(purchaseB.body.purchase._id).lean();
    expect(savedPurchase.items[0].receivedQuantity).toBe(0);
    expect(await stockOf(productB._id)).toBe(stockBefore);
  });

  test("authenticated requests fail closed without a valid business context", async () => {
    const business = await createBusiness({ name: "No Context Biz", slug: "no-context-biz" });
    await createUser({
      business,
      email: "no-context@example.com",
      role: "owner",
      name: "No Context Owner",
    });
    const cookie = await loginAs("no-context@example.com");
    await RefreshSession.updateMany({}, { $set: { businessId: null } });

    const response = await request(app)
      .get("/api/sale-orders")
      .set("Cookie", cookie);
    expect(response.status).toBe(403);
  });
});
