const request = require("supertest");
const app = require("../src/app");
const Customer = require("../src/models/Customer");
const SaleOrder = require("../src/models/SaleOrder");
const { createBusiness, createUser } = require("./helpers/auth");
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
} = require("./helpers/test-db");
const {
  recalculateCustomerFinancials,
} = require("../src/utils/financials");

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

async function createProduct(overrides = {}) {
  const response = await request(app).post("/api/products").send({
    title: "Financial Widget",
    sku: `FIN-${randomSuffix().toUpperCase()}`,
    category: "Test",
    brand: "Test Brand",
    openingStock: 500,
    reorderThreshold: 5,
    priceUnit: "Piece",
    uom: "Piece",
    purchasePrice: 5,
    wholesalePrice: 10,
    retailPrice: 20,
    ...overrides,
  });
  expect(response.status).toBe(201);
  return response.body.product;
}

function customerPayload(overrides = {}) {
  return {
    name: "Account Holder",
    businessName: `Financial Traders ${randomSuffix()}`,
    phone: `+92 300${Math.floor(1000000 + Math.random() * 9000000)}`,
    city: "Lahore",
    address: "Test Address",
    customerType: "Wholesale",
    status: "Active",
    route: "unassigned",
    creditLimit: 1000000,
    paymentTerms: "cod",
    openingBalance: 100,
    ...overrides,
  };
}

async function createCustomer(overrides = {}) {
  const response = await request(app).post("/api/customers").send(customerPayload(overrides));
  expect(response.status).toBe(201);
  return response.body.customer;
}

function salePayload(customer, product, overrides = {}) {
  return {
    customerId: String(customer._id),
    customer: customer.name,
    phone: customer.phone,
    paymentStatus: "unpaid",
    paymentMethod: "Cash",
    status: "Pending Approval",
    items: [
      {
        name: product.title,
        sku: product.sku,
        productId: String(product._id),
        quantity: 2,
        unitLabel: "Piece",
        unitPrice: 999, // Must be ignored: catalog price is authoritative.
      },
    ],
    discount: 0,
    freight: 0,
    ...overrides,
  };
}

async function createSale(customer, product, overrides = {}) {
  const response = await request(app)
    .post("/api/sale-orders")
    .send(salePayload(customer, product, overrides));
  expect(response.status).toBe(201);
  return response.body.order;
}


async function customerFromDb(id) {
  const customer = await Customer.findById(id).lean();
  expect(customer).not.toBeNull();
  return customer;
}

describe("customer financial integrity", () => {
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

  test("creating a sale updates the correct customer's stored financial summary", async () => {
    const product = await createProduct();
    const customer = await createCustomer();
    const other = await createCustomer();

    await createSale(customer, product);

    const saved = await customerFromDb(customer._id);
    expect(saved.orders).toBe(1);
    expect(saved.totalPurchases).toBe(20);
    expect(saved.outstanding).toBe(120); // opening balance + unpaid order

    const untouched = await customerFromDb(other._id);
    expect(untouched.orders).toBe(0);
    expect(untouched.totalPurchases).toBe(0);
    expect(untouched.outstanding).toBe(100);
  });

  test("a partial payment does not treat the full sale total as received", async () => {
    const product = await createProduct();
    const customer = await createCustomer({ openingBalance: 0 });
    const order = await createSale(customer, product, {
      paymentStatus: "partial",
      amountReceived: 5,
    });

    expect(order.financials).toMatchObject({ total: 20, paid: 5, outstanding: 15 });

    const saved = await customerFromDb(customer._id);
    expect(saved.totalPurchases).toBe(20);
    expect(saved.outstanding).toBe(15);
    expect(saved.outstanding).not.toBe(20);

    const paid = await request(app)
      .post(`/api/sale-orders/${order._id}/payment`)
      .send({ amount: 10, method: "Cash" });
    expect(paid.status).toBe(200);

    const afterPayment = await customerFromDb(customer._id);
    expect(afterPayment.outstanding).toBe(5);
    expect(afterPayment.totalPurchases).toBe(20);
  });

  test("multiple sales aggregate into the stored customer summary", async () => {
    const product = await createProduct();
    const customer = await createCustomer({ openingBalance: 50 });

    await createSale(customer, product, { items: [{ ...salePayload(customer, product).items[0], quantity: 3 }] });
    await createSale(customer, product, {
      paymentStatus: "partial",
      amountReceived: 10,
      items: [{ ...salePayload(customer, product).items[0], quantity: 4 }],
    });

    const saved = await customerFromDb(customer._id);
    expect(saved.orders).toBe(2);
    expect(saved.totalPurchases).toBe(70);
    expect(saved.outstanding).toBe(110); // 50 + 30 + (40 - 10)
  });

  test("editing a sale replaces its previous contribution instead of adding it again", async () => {
    const product = await createProduct();
    const customer = await createCustomer({ openingBalance: 0 });
    const order = await createSale(customer, product);

    const increased = await request(app)
      .put(`/api/sale-orders/${order._id}`)
      .send(
        salePayload(customer, product, {
          items: [{ ...salePayload(customer, product).items[0], quantity: 5 }],
        })
      );
    expect(increased.status).toBe(200);
    let saved = await customerFromDb(customer._id);
    expect(saved.totalPurchases).toBe(50);
    expect(saved.outstanding).toBe(50);

    const decreased = await request(app)
      .put(`/api/sale-orders/${order._id}`)
      .send(
        salePayload(customer, product, {
          items: [{ ...salePayload(customer, product).items[0], quantity: 1 }],
        })
      );
    expect(decreased.status).toBe(200);
    saved = await customerFromDb(customer._id);
    expect(saved.orders).toBe(1);
    expect(saved.totalPurchases).toBe(10);
    expect(saved.outstanding).toBe(10);
  });

  test("cancelling a sale removes it from active customer financials and is idempotent", async () => {
    const product = await createProduct();
    const customer = await createCustomer();
    const order = await createSale(customer, product, {
      paymentStatus: "partial",
      amountReceived: 5,
    });

    const cancelled = await request(app)
      .patch(`/api/sale-orders/${order._id}/status`)
      .send({ status: "Cancelled" });
    expect(cancelled.status).toBe(200);

    let saved = await customerFromDb(customer._id);
    expect(saved.orders).toBe(0);
    expect(saved.totalPurchases).toBe(0);
    expect(saved.outstanding).toBe(100);

    const repeated = await request(app)
      .patch(`/api/sale-orders/${order._id}/status`)
      .send({ status: "Cancelled" });
    expect(repeated.status).toBe(200);
    saved = await customerFromDb(customer._id);
    expect(saved.orders).toBe(0);
    expect(saved.totalPurchases).toBe(0);
    expect(saved.outstanding).toBe(100);
  });

  test("deleting a sale leaves no stale customer totals", async () => {
    const product = await createProduct();
    const customer = await createCustomer();
    const order = await createSale(customer, product);

    const deleted = await request(app).delete(`/api/sale-orders/${order._id}`);
    expect(deleted.status).toBe(200);

    const saved = await customerFromDb(customer._id);
    expect(saved.orders).toBe(0);
    expect(saved.totalPurchases).toBe(0);
    expect(saved.outstanding).toBe(100);
    expect(await SaleOrder.countDocuments()).toBe(0);
  });

  test("repeated valid status updates never double-count the same sale", async () => {
    const product = await createProduct();
    const customer = await createCustomer({ openingBalance: 0 });
    const order = await createSale(customer, product);

    for (const status of ["Processing", "Packed", "Dispatched", "Delivered", "Delivered"]) {
      const response = await request(app)
        .patch(`/api/sale-orders/${order._id}/status`)
        .send({ status });
      expect(response.status).toBe(200);
    }

    const saved = await customerFromDb(customer._id);
    expect(saved.orders).toBe(1);
    expect(saved.totalPurchases).toBe(20);
    expect(saved.outstanding).toBe(20);
  });

  test("a sale without a valid customer does not corrupt another customer", async () => {
    const product = await createProduct();
    const customer = await createCustomer();
    const before = await customerFromDb(customer._id);

    const orphan = await request(app)
      .post("/api/sale-orders")
      .send(
        salePayload(customer, product, {
          customerId: String(customer._id).replace(/.$/, customer._id.toString().endsWith("0") ? "1" : "0"),
          customer: "Unknown Walk-in",
          phone: "+92 3999999999",
        })
      );
    expect(orphan.status).toBe(201);
    expect(orphan.body.order.customer.customerId).toBeNull();

    const after = await customerFromDb(customer._id);
    expect(after.orders).toBe(before.orders);
    expect(after.totalPurchases).toBe(before.totalPurchases);
    expect(after.outstanding).toBe(before.outstanding);
  });

  test("customer profile and list return the same financial values as the database", async () => {
    const product = await createProduct({ wholesalePrice: 10.25 });
    const customer = await createCustomer({ openingBalance: 25.5 });
    await createSale(customer, product, {
      items: [{ ...salePayload(customer, product).items[0], quantity: 3 }],
    });

    const saved = await customerFromDb(customer._id);
    expect(saved.totalPurchases).toBe(30.75);
    expect(saved.outstanding).toBe(56.25);

    const list = await request(app).get("/api/customers");
    expect(list.status).toBe(200);
    const listRow = list.body.customers.find((row) => row._id === String(customer._id));
    expect(listRow).toMatchObject({
      orders: saved.orders,
      totalPurchases: saved.totalPurchases,
      outstanding: saved.outstanding,
    });

    const detail = await request(app).get(`/api/customers/${customer._id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.customer).toMatchObject({
      openingBalance: saved.openingBalance,
      orders: saved.orders,
      totalPurchases: saved.totalPurchases,
      outstanding: saved.outstanding,
    });
  });

  test("a zero-value sale is rejected and does not change customer financials", async () => {
    const product = await createProduct({ wholesalePrice: 0 });
    const customer = await createCustomer();
    const before = await customerFromDb(customer._id);

    const response = await request(app)
      .post("/api/sale-orders")
      .send(salePayload(customer, product));
    expect(response.status).toBe(400);

    const after = await customerFromDb(customer._id);
    expect(after.orders).toBe(before.orders);
    expect(after.totalPurchases).toBe(before.totalPurchases);
    expect(after.outstanding).toBe(before.outstanding);
  });

  test("concurrent customer recalculations do not overwrite a newer ledger state", async () => {
    const product = await createProduct();
    const customer = await createCustomer({ openingBalance: 0 });
    await createSale(customer, product);

    const originalAggregate = SaleOrder.aggregate;
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
    const spy = jest.spyOn(SaleOrder, "aggregate").mockImplementation((pipeline) =>
      originalAggregate.call(SaleOrder, pipeline).then(async (result) => {
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
      const first = recalculateCustomerFinancials({ customerId: customer._id });
      await firstArrived;
      const second = recalculateCustomerFinancials({ customerId: customer._id });
      await Promise.race([
        secondArrived,
        new Promise((resolve) => {
          timeoutId = setTimeout(resolve, 500);
        }),
      ]);

      // Commit another sale after the first recomputation read the ledger. A
      // serialized second recomputation must see this sale before writing.
      await SaleOrder.create({
        orderNumber: "SO-CONC-REVIEW",
        customer: {
          customerId: customer._id,
          name: customer.name,
          phone: customer.phone,
          location: "",
        },
        status: "Pending Approval",
        paymentStatus: "unpaid",
        items: [],
        financials: { total: 20, paid: 0, outstanding: 20 },
      });
      release();
      await Promise.all([first, second]);
    } finally {
      clearTimeout(timeoutId);
      spy.mockRestore();
    }

    const saved = await customerFromDb(customer._id);
    expect(saved).toMatchObject({ orders: 2, totalPurchases: 40, outstanding: 40 });
  });

  test("a failed customer recalculation rolls back a plain status update", async () => {
    const product = await createProduct();
    const customer = await createCustomer({ openingBalance: 0 });
    const order = await createSale(customer, product);

    const originalUpdateOne = Customer.updateOne;
    const summaryWriteSpy = jest
      .spyOn(Customer, "updateOne")
      .mockImplementationOnce(() => {
        throw new Error("simulated customer summary write failure");
      })
      .mockImplementation((...args) => originalUpdateOne.apply(Customer, args));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      const response = await request(app)
        .patch(`/api/sale-orders/${order._id}/status`)
        .send({ status: "Processing" });
      expect(response.status).toBe(500);
    } finally {
      consoleSpy.mockRestore();
      summaryWriteSpy.mockRestore();
    }

    const savedOrder = await SaleOrder.findById(order._id).lean();
    const savedCustomer = await customerFromDb(customer._id);
    expect(savedOrder.status).toBe("Pending Approval");
    expect(savedCustomer).toMatchObject({ orders: 1, totalPurchases: 20, outstanding: 20 });
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

    test("a customer belonging to another tenant cannot be updated", async () => {
      const businessA = await createBusiness({ name: "Fin A", slug: "fin-a" });
      const businessB = await createBusiness({ name: "Fin B", slug: "fin-b" });
      await createUser({ business: businessA, email: "fin-a@example.com", role: "owner" });
      await createUser({ business: businessB, email: "fin-b@example.com", role: "owner" });
      const cookieA = await loginAs("fin-a@example.com");
      const cookieB = await loginAs("fin-b@example.com");

      const createdB = await request(app)
        .post("/api/customers")
        .set("Cookie", cookieB)
        .send(customerPayload({ businessName: "Tenant B Biz" }));
      expect(createdB.status).toBe(201);
      const customerB = createdB.body.customer;

      const createdProduct = await request(app)
        .post("/api/products")
        .set("Cookie", cookieA)
        .send({
          title: "Tenant A Product",
          sku: `FIN-T-${randomSuffix()}`,
          category: "Test",
          brand: "Test",
          openingStock: 50,
          reorderThreshold: 5,
          wholesalePrice: 10,
          purchasePrice: 5,
        });
      expect(createdProduct.status).toBe(201);

      const crossTenantSale = await request(app)
        .post("/api/sale-orders")
        .set("Cookie", cookieA)
        .send(
          salePayload(customerB, createdProduct.body.product, {
            customer: customerB.name,
          })
        );
      expect(crossTenantSale.status).toBe(404);

      const unchanged = await customerFromDb(customerB._id);
      expect(unchanged.orders).toBe(0);
      expect(unchanged.totalPurchases).toBe(0);
      expect(unchanged.outstanding).toBe(100);

      const direct = await recalculateCustomerFinancials({
        customerId: customerB._id,
        businessId: businessA._id,
      });
      expect(direct).toBeNull();
      expect(await customerFromDb(customerB._id)).toMatchObject({
        orders: 0,
        totalPurchases: 0,
        outstanding: 100,
      });
    });
  });
});
