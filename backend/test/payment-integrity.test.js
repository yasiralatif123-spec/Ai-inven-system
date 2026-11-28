const request = require("supertest");
const app = require("../src/app");
const Customer = require("../src/models/Customer");
const Supplier = require("../src/models/Supplier");
const SaleOrder = require("../src/models/SaleOrder");
const Purchase = require("../src/models/Purchase");
const { createBusiness, createUser } = require("./helpers/auth");
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
} = require("./helpers/test-db");

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

async function createProduct(overrides = {}) {
  const response = await request(app).post("/api/products").send({
    title: "Payment Widget",
    sku: `PAY-${randomSuffix().toUpperCase()}`,
    category: "Test",
    brand: "Test Brand",
    openingStock: 500,
    reorderThreshold: 5,
    priceUnit: "Piece",
    uom: "Piece",
    purchasePrice: 10,
    wholesalePrice: 10,
    retailPrice: 20,
    ...overrides,
  });
  expect(response.status).toBe(201);
  return response.body.product;
}

function customerPayload(overrides = {}) {
  return {
    name: "Payment Customer",
    businessName: `Payment Traders ${randomSuffix()}`,
    phone: `+92 300${Math.floor(1000000 + Math.random() * 9000000)}`,
    city: "Lahore",
    address: "Test Address",
    customerType: "Wholesale",
    status: "Active",
    route: "unassigned",
    creditLimit: 1000000,
    paymentTerms: "cod",
    openingBalance: 0,
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
        unitPrice: 999,
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

function supplierPayload(overrides = {}) {
  return {
    name: `Payment Supplier ${randomSuffix()}`,
    contactPerson: "Contact",
    phone: `+92 301${Math.floor(1000000 + Math.random() * 9000000)}`,
    address: "Test Address",
    paymentTerms: "net-30",
    openingBalance: 0,
    ...overrides,
  };
}

async function createSupplier(overrides = {}) {
  const response = await request(app).post("/api/suppliers").send(supplierPayload(overrides));
  expect(response.status).toBe(201);
  return response.body.supplier;
}

function purchaseItem(product, overrides = {}) {
  return {
    name: product.title,
    sku: product.sku,
    productId: String(product._id),
    quantity: 2,
    unit: "Piece",
    unitPrice: 999,
    discount: 0,
    taxRate: 0,
    ...overrides,
  };
}

function purchasePayload(supplier, product, overrides = {}) {
  return {
    supplierId: String(supplier._id),
    purchaseDate: "2026-01-01",
    expectedDelivery: "2026-01-05",
    invoiceNumber: `PAY-INV-${randomSuffix()}`,
    status: "Draft",
    freight: 0,
    paymentAmount: 0,
    items: [purchaseItem(product)],
    ...overrides,
  };
}

async function createPurchase(supplier, product, overrides = {}) {
  const response = await request(app)
    .post("/api/purchases")
    .send(purchasePayload(supplier, product, overrides));
  expect(response.status).toBe(201);
  return response.body.purchase;
}

async function saleFromDb(id) {
  const order = await SaleOrder.findById(id).lean();
  expect(order).not.toBeNull();
  return order;
}

async function purchaseFromDb(id) {
  const purchase = await Purchase.findById(id).lean();
  expect(purchase).not.toBeNull();
  return purchase;
}

async function customerFromDb(id) {
  const customer = await Customer.findById(id).lean();
  expect(customer).not.toBeNull();
  return customer;
}

async function supplierFromDb(id) {
  const supplier = await Supplier.findById(id).lean();
  expect(supplier).not.toBeNull();
  return supplier;
}

function sumRecords(payments = []) {
  return Math.round(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) * 100) / 100;
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

/**
 * Holds both conditional payment writes at the same point so both requests read
 * the same balance before either write lands. This makes the version/idempotency
 * guards deterministic instead of relying on timing luck.
 */
async function racePayments(Model, path, payloads) {
  const originalUpdateOne = Model.updateOne;
  const resolvers = [];
  const arrivals = payloads.map(
    () => new Promise((resolve) => resolvers.push(resolve))
  );
  let releaseWrites;
  const gate = new Promise((resolve) => {
    releaseWrites = resolve;
  });
  let seen = 0;

  const spy = jest.spyOn(Model, "updateOne").mockImplementation(function (filter, update, options) {
    if (update && update.$push && update.$push.payments) {
      const index = seen;
      seen += 1;
      if (resolvers[index]) resolvers[index]();
      return gate.then(() => originalUpdateOne.apply(Model, arguments));
    }
    return originalUpdateOne.apply(Model, arguments);
  });

  let timeoutId;
  try {
    const responses = payloads.map((payload) =>
      request(app).post(path).send(payload).then((response) => response)
    );
    await Promise.race([
      Promise.all(arrivals),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Concurrent payments did not reach the write guard")), 4000);
      }),
    ]);
    releaseWrites();
    return await Promise.all(responses);
  } finally {
    clearTimeout(timeoutId);
    releaseWrites();
    spy.mockRestore();
  }
}

describe("manual payment integrity", () => {
  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("sale payments", () => {
    test("a full sale payment is recorded and paid total equals the ledger", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);

      const response = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: 20, method: "Cash", idempotencyKey: "sale-full-1" });
      expect(response.status).toBe(200);

      const saved = await saleFromDb(order._id);
      expect(saved.financials).toMatchObject({ total: 20, paid: 20, outstanding: 0 });
      expect(saved.paymentStatus).toBe("paid");
      expect(saved.payments).toHaveLength(1);
      expect(saved.payments[0]).toMatchObject({
        amount: 20,
        method: "Cash",
        idempotencyKey: "sale-full-1",
      });
      expect(sumRecords(saved.payments)).toBe(saved.financials.paid);
      expect(await customerFromDb(customer._id)).toMatchObject({ totalPurchases: 20, outstanding: 0 });
    });

    test("a customer with a paid sale cannot be deleted and keeps the payment record", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);

      const paid = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: 20, method: "Cash", idempotencyKey: "sale-delete-guard-1" });
      expect(paid.status).toBe(200);
      const before = await saleFromDb(order._id);

      const response = await request(app).delete(`/api/customers/${customer._id}`);
      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/sale\/payment history/i);

      expect(await customerFromDb(customer._id)).not.toBeNull();
      const after = await saleFromDb(order._id);
      expect(after.financials).toMatchObject(before.financials);
      expect(after.payments).toHaveLength(1);
      expect(after.payments[0]).toMatchObject({
        amount: 20,
        idempotencyKey: "sale-delete-guard-1",
      });
    });

    test("partial sale payments accumulate until the order is settled", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);

      const first = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: 5, method: "Cash", idempotencyKey: "sale-partial-1" });
      expect(first.status).toBe(200);

      let saved = await saleFromDb(order._id);
      expect(saved.financials).toMatchObject({ paid: 5, outstanding: 15 });
      expect(saved.paymentStatus).toBe("partial");
      expect(sumRecords(saved.payments)).toBe(5);

      const second = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: 15, method: "Bank Transfer", idempotencyKey: "sale-partial-2" });
      expect(second.status).toBe(200);

      saved = await saleFromDb(order._id);
      expect(saved.financials).toMatchObject({ paid: 20, outstanding: 0 });
      expect(saved.paymentStatus).toBe("paid");
      expect(saved.payments).toHaveLength(2);
      expect(sumRecords(saved.payments)).toBe(20);
      expect(await customerFromDb(customer._id)).toMatchObject({ outstanding: 0 });
    });

    test("multiple sale payments keep distinct immutable records", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);

      for (const [amount, key] of [[4, "sale-multi-a"], [6, "sale-multi-b"], [3, "sale-multi-c"]]) {
        const response = await request(app)
          .post(`/api/sale-orders/${order._id}/payment`)
          .send({ amount, method: "Cash", idempotencyKey: key });
        expect(response.status).toBe(200);
      }

      const saved = await saleFromDb(order._id);
      expect(saved.payments.map((payment) => payment.amount)).toEqual([4, 6, 3]);
      expect(new Set(saved.payments.map((payment) => payment.idempotencyKey)).size).toBe(3);
      expect(saved.payments.every((payment) => payment.paidAt instanceof Date)).toBe(true);
      expect(saved.financials).toMatchObject({ paid: 13, outstanding: 7 });
      expect(sumRecords(saved.payments)).toBe(saved.financials.paid);
      expect(await customerFromDb(customer._id)).toMatchObject({ outstanding: 7 });
    });

    test("a legacy sale paid total is migrated into a record on the first new payment", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);
      await SaleOrder.updateOne(
        { _id: order._id },
        { $set: { "financials.paid": 8, "financials.outstanding": 12 } }
      );

      const response = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: 5, method: "Cash", idempotencyKey: "sale-legacy-1" });
      expect(response.status).toBe(200);

      const saved = await saleFromDb(order._id);
      expect(saved.payments).toHaveLength(2);
      expect(saved.payments.some((payment) => payment.idempotencyKey.startsWith("legacy_balance_"))).toBe(true);
      expect(sumRecords(saved.payments)).toBe(13);
      expect(saved.financials).toMatchObject({ paid: 13, outstanding: 7 });
      expect(await customerFromDb(customer._id)).toMatchObject({ outstanding: 7 });
    });

    test("a malformed sale payment amount is rejected without changing MongoDB", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);

      const response = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: "abc", method: "Cash" });
      expect(response.status).toBe(400);

      const saved = await saleFromDb(order._id);
      expect(saved.financials).toMatchObject({ paid: 0, outstanding: 20 });
      expect(saved.payments).toHaveLength(0);
      expect(await customerFromDb(customer._id)).toMatchObject({ outstanding: 20 });
    });

    test("a zero sale payment is rejected", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);

      const response = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: 0, method: "Cash" });
      expect(response.status).toBe(400);

      expect((await saleFromDb(order._id)).payments).toHaveLength(0);
      expect(await customerFromDb(customer._id)).toMatchObject({ outstanding: 20 });
    });

    test("a negative sale payment is rejected", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);

      const response = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: -5, method: "Cash" });
      expect(response.status).toBe(400);

      expect((await saleFromDb(order._id)).payments).toHaveLength(0);
    });

    test("scientific notation is rejected as an invalid money value", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);

      const response = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: "1e3", method: "Cash" });
      expect(response.status).toBe(400);

      expect((await saleFromDb(order._id)).payments).toHaveLength(0);
      expect(await customerFromDb(customer._id)).toMatchObject({ outstanding: 20 });
    });

    test("a sale payment above the outstanding balance is rejected", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product, {
        paymentStatus: "partial",
        amountReceived: 5,
      });

      const response = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: 16, method: "Cash" });
      expect(response.status).toBe(400);

      const saved = await saleFromDb(order._id);
      expect(saved.financials).toMatchObject({ paid: 5, outstanding: 15 });
      expect(saved.payments).toHaveLength(1);
      expect(sumRecords(saved.payments)).toBe(5);
    });

    test("replaying the same sale idempotency key never records a second payment", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);
      const payload = { amount: 7, method: "Cash", idempotencyKey: "sale-duplicate-1" };

      const first = await request(app).post(`/api/sale-orders/${order._id}/payment`).send(payload);
      const second = await request(app).post(`/api/sale-orders/${order._id}/payment`).send(payload);
      expect(first.status).toBe(200);
      expect(second.status).toBe(200);

      const saved = await saleFromDb(order._id);
      expect(saved.payments).toHaveLength(1);
      expect(saved.financials).toMatchObject({ paid: 7, outstanding: 13 });
      expect(await customerFromDb(customer._id)).toMatchObject({ outstanding: 13 });
    });

    test("a reused sale idempotency key with a different amount is rejected", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);

      const first = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: 7, method: "Cash", idempotencyKey: "sale-conflict-key" });
      expect(first.status).toBe(200);
      const second = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: 8, method: "Cash", idempotencyKey: "sale-conflict-key" });
      expect(second.status).toBe(409);

      const saved = await saleFromDb(order._id);
      expect(saved.payments).toHaveLength(1);
      expect(saved.financials).toMatchObject({ paid: 7, outstanding: 13 });
    });

    test("concurrent sale payments with different keys are both recorded", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);

      const responses = await racePayments(SaleOrder, `/api/sale-orders/${order._id}/payment`, [
        { amount: 5, method: "Cash", idempotencyKey: "sale-race-a" },
        { amount: 6, method: "Cash", idempotencyKey: "sale-race-b" },
      ]);
      expect(responses.map((response) => response.status)).toEqual([200, 200]);

      const saved = await saleFromDb(order._id);
      expect(saved.payments).toHaveLength(2);
      expect(sumRecords(saved.payments)).toBe(11);
      expect(saved.financials).toMatchObject({ paid: 11, outstanding: 9 });
      expect(await customerFromDb(customer._id)).toMatchObject({ outstanding: 9 });
    });

    test("concurrent sale payments cannot exceed the balance", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);

      const responses = await racePayments(SaleOrder, `/api/sale-orders/${order._id}/payment`, [
        { amount: 15, method: "Cash", idempotencyKey: "sale-race-over-a" },
        { amount: 15, method: "Cash", idempotencyKey: "sale-race-over-b" },
      ]);
      expect(responses.map((response) => response.status).sort()).toEqual([200, 400]);

      const saved = await saleFromDb(order._id);
      expect(saved.payments).toHaveLength(1);
      expect(saved.financials).toMatchObject({ paid: 15, outstanding: 5 });
      expect(await customerFromDb(customer._id)).toMatchObject({ outstanding: 5 });
    });

    test("editing a sale preserves recorded payments", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product, {
        paymentStatus: "partial",
        amountReceived: 5,
      });

      const updated = await request(app)
        .put(`/api/sale-orders/${order._id}`)
        .send(salePayload(customer, product, { paymentStatus: "partial", amountReceived: 5, bay: "B2" }));
      expect(updated.status).toBe(200);

      const saved = await saleFromDb(order._id);
      expect(saved.bay).toBe("B2");
      expect(saved.payments).toHaveLength(1);
      expect(saved.payments[0]).toMatchObject({ amount: 5 });
      expect(saved.financials).toMatchObject({ paid: 5, outstanding: 15 });
      expect(await customerFromDb(customer._id)).toMatchObject({ outstanding: 15 });
    });

    test("a sale edit cannot erase recorded payments", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product, {
        paymentStatus: "partial",
        amountReceived: 5,
      });
      const before = await saleFromDb(order._id);

      const updated = await request(app)
        .put(`/api/sale-orders/${order._id}`)
        .send(salePayload(customer, product, { paymentStatus: "unpaid" }));
      expect(updated.status).toBe(400);

      const saved = await saleFromDb(order._id);
      expect(saved.financials).toEqual(before.financials);
      expect(saved.payments).toHaveLength(1);
      expect(saved.paymentStatus).toBe("partial");
    });

    test("payments are rejected on a cancelled sale without touching the ledger", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);
      const cancelled = await request(app)
        .patch(`/api/sale-orders/${order._id}/status`)
        .send({ status: "Cancelled" });
      expect(cancelled.status).toBe(200);

      const response = await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: 10, method: "Cash" });
      expect(response.status).toBe(400);

      const saved = await saleFromDb(order._id);
      expect(saved.payments).toHaveLength(0);
      expect(saved.financials).toMatchObject({ paid: 0, outstanding: 20 });
      expect(await customerFromDb(customer._id)).toMatchObject({ outstanding: 0 });
    });

    test("a failed sale recalculation rolls back the payment and its record", async () => {
      const product = await createProduct();
      const customer = await createCustomer();
      const order = await createSale(customer, product);
      const originalUpdateOne = Customer.updateOne;
      const summaryWriteSpy = jest
        .spyOn(Customer, "updateOne")
        .mockImplementationOnce(() => {
          throw new Error("simulated customer summary failure");
        })
        .mockImplementation((...args) => originalUpdateOne.apply(Customer, args));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      try {
        const response = await request(app)
          .post(`/api/sale-orders/${order._id}/payment`)
          .send({ amount: 10, method: "Cash", idempotencyKey: "sale-rollback-1" });
        expect(response.status).toBe(500);
      } finally {
        consoleSpy.mockRestore();
        summaryWriteSpy.mockRestore();
      }

      const saved = await saleFromDb(order._id);
      expect(saved.payments).toHaveLength(0);
      expect(saved.financials).toMatchObject({ paid: 0, outstanding: 20 });
      expect(saved.paymentStatus).toBe("unpaid");
      expect(await customerFromDb(customer._id)).toMatchObject({ outstanding: 20 });
    });
  });

  describe("purchase payments", () => {
    test("a full purchase payment is recorded and paid total equals the ledger", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product);

      const response = await request(app)
        .post(`/api/purchases/${purchase._id}/payment`)
        .send({ amount: 20, method: "Cash", reference: "VOUCHER-1", idempotencyKey: "purchase-full-1" });
      expect(response.status).toBe(200);

      const saved = await purchaseFromDb(purchase._id);
      expect(saved.financials.total).toBe(20);
      expect(saved.paidAmount).toBe(20);
      expect(saved.payments).toHaveLength(1);
      expect(saved.payments[0]).toMatchObject({
        amount: 20,
        reference: "VOUCHER-1",
        idempotencyKey: "purchase-full-1",
      });
      expect(sumRecords(saved.payments)).toBe(saved.paidAmount);
      expect(await supplierFromDb(supplier._id)).toMatchObject({ totalPurchases: 20, outstanding: 0 });
    });

    test("a supplier with a paid purchase cannot be deleted and keeps the payment record", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product);

      const paid = await request(app)
        .post(`/api/purchases/${purchase._id}/payment`)
        .send({ amount: 20, method: "Cash", idempotencyKey: "purchase-delete-guard-1" });
      expect(paid.status).toBe(200);
      const before = await purchaseFromDb(purchase._id);

      const response = await request(app).delete(`/api/suppliers/${supplier._id}`);
      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/purchase\/payment history/i);

      expect(await supplierFromDb(supplier._id)).not.toBeNull();
      const after = await purchaseFromDb(purchase._id);
      expect(after.financials).toMatchObject(before.financials);
      expect(after.payments).toHaveLength(1);
      expect(after.payments[0]).toMatchObject({
        amount: 20,
        idempotencyKey: "purchase-delete-guard-1",
      });
    });

    test("partial purchase payments accumulate against the supplier balance", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product, { paymentAmount: 5 });

      const first = await request(app)
        .post(`/api/purchases/${purchase._id}/payment`)
        .send({ amount: 5, method: "Cash", idempotencyKey: "purchase-partial-1" });
      expect(first.status).toBe(200);
      expect(await supplierFromDb(supplier._id)).toMatchObject({ outstanding: 10 });

      const second = await request(app)
        .post(`/api/purchases/${purchase._id}/payment`)
        .send({ amount: 10, method: "Bank Transfer", idempotencyKey: "purchase-partial-2" });
      expect(second.status).toBe(200);

      const saved = await purchaseFromDb(purchase._id);
      expect(saved.paidAmount).toBe(20);
      expect(saved.payments).toHaveLength(3);
      expect(sumRecords(saved.payments)).toBe(20);
      expect(await supplierFromDb(supplier._id)).toMatchObject({ outstanding: 0 });
    });

    test("an initial purchase payment is stored as an immutable record", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product, {
        paymentAmount: 5,
        paymentMethod: "Cash",
        paymentReference: "INITIAL-1",
      });

      const saved = await purchaseFromDb(purchase._id);
      expect(saved.paidAmount).toBe(5);
      expect(saved.payments).toHaveLength(1);
      expect(saved.payments[0].idempotencyKey).toMatch(/^purchase_initial_/);
      expect(saved.payments[0]).toMatchObject({ amount: 5, reference: "INITIAL-1" });
      expect(await supplierFromDb(supplier._id)).toMatchObject({ outstanding: 15 });
    });

    test("a malformed purchase payment amount is rejected without changing MongoDB", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product);

      const response = await request(app)
        .post(`/api/purchases/${purchase._id}/payment`)
        .send({ amount: "abc", method: "Cash" });
      expect(response.status).toBe(400);

      const saved = await purchaseFromDb(purchase._id);
      expect(saved.paidAmount).toBe(0);
      expect(saved.payments).toHaveLength(0);
      expect(await supplierFromDb(supplier._id)).toMatchObject({ outstanding: 20 });
    });

    test("a zero purchase payment is rejected", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product);

      const response = await request(app)
        .post(`/api/purchases/${purchase._id}/payment`)
        .send({ amount: 0, method: "Cash" });
      expect(response.status).toBe(400);

      expect((await purchaseFromDb(purchase._id)).payments).toHaveLength(0);
    });

    test("a negative purchase payment is rejected", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product);

      const response = await request(app)
        .post(`/api/purchases/${purchase._id}/payment`)
        .send({ amount: -5, method: "Cash" });
      expect(response.status).toBe(400);

      expect((await purchaseFromDb(purchase._id)).payments).toHaveLength(0);
    });

    test("a purchase payment above the remaining balance is rejected", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product, { paymentAmount: 5 });

      const response = await request(app)
        .post(`/api/purchases/${purchase._id}/payment`)
        .send({ amount: 16, method: "Cash" });
      expect(response.status).toBe(400);

      const saved = await purchaseFromDb(purchase._id);
      expect(saved.paidAmount).toBe(5);
      expect(saved.payments).toHaveLength(1);
      expect(await supplierFromDb(supplier._id)).toMatchObject({ outstanding: 15 });
    });

    test("replaying the same purchase idempotency key never records a second payment", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product);
      const payload = { amount: 7, method: "Cash", idempotencyKey: "purchase-duplicate-1" };

      const first = await request(app).post(`/api/purchases/${purchase._id}/payment`).send(payload);
      const second = await request(app).post(`/api/purchases/${purchase._id}/payment`).send(payload);
      expect(first.status).toBe(200);
      expect(second.status).toBe(200);

      const saved = await purchaseFromDb(purchase._id);
      expect(saved.payments).toHaveLength(1);
      expect(saved.paidAmount).toBe(7);
      expect(await supplierFromDb(supplier._id)).toMatchObject({ outstanding: 13 });
    });

    test("concurrent purchase payments with different keys are both recorded", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product);

      const responses = await racePayments(Purchase, `/api/purchases/${purchase._id}/payment`, [
        { amount: 5, method: "Cash", idempotencyKey: "purchase-race-a" },
        { amount: 6, method: "Cash", idempotencyKey: "purchase-race-b" },
      ]);
      expect(responses.map((response) => response.status)).toEqual([200, 200]);

      const saved = await purchaseFromDb(purchase._id);
      expect(saved.payments).toHaveLength(2);
      expect(sumRecords(saved.payments)).toBe(11);
      expect(saved.paidAmount).toBe(11);
      expect(await supplierFromDb(supplier._id)).toMatchObject({ outstanding: 9 });
    });

    test("a purchase edit preserves recorded payments", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product, { paymentAmount: 5 });

      const updated = await request(app)
        .put(`/api/purchases/${purchase._id}`)
        .send(purchasePayload(supplier, product, { notes: "Payment ledger preserved" }));
      expect(updated.status).toBe(200);

      const saved = await purchaseFromDb(purchase._id);
      expect(saved.notes).toBe("Payment ledger preserved");
      expect(saved.paidAmount).toBe(5);
      expect(saved.payments).toHaveLength(1);
      expect(sumRecords(saved.payments)).toBe(5);
      expect(await supplierFromDb(supplier._id)).toMatchObject({ outstanding: 15 });
    });

    test("a purchase edit cannot create an overpaid document", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product);
      const payment = await request(app)
        .post(`/api/purchases/${purchase._id}/payment`)
        .send({ amount: 15, method: "Cash", idempotencyKey: "purchase-edit-guard" });
      expect(payment.status).toBe(200);

      const updated = await request(app)
        .put(`/api/purchases/${purchase._id}`)
        .send(purchasePayload(supplier, product, { items: [purchaseItem(product, { quantity: 1 })] }));
      expect(updated.status).toBe(400);

      const saved = await purchaseFromDb(purchase._id);
      expect(saved.financials.total).toBe(20);
      expect(saved.paidAmount).toBe(15);
      expect(saved.payments).toHaveLength(1);
      expect(await supplierFromDb(supplier._id)).toMatchObject({ outstanding: 5 });
    });

    test("payments are rejected on a cancelled purchase without touching the ledger", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product);
      const cancelled = await request(app)
        .patch(`/api/purchases/${purchase._id}/status`)
        .send({ status: "Cancelled" });
      expect(cancelled.status).toBe(200);

      const response = await request(app)
        .post(`/api/purchases/${purchase._id}/payment`)
        .send({ amount: 10, method: "Cash" });
      expect(response.status).toBe(400);

      const saved = await purchaseFromDb(purchase._id);
      expect(saved.payments).toHaveLength(0);
      expect(saved.paidAmount).toBe(0);
      expect(await supplierFromDb(supplier._id)).toMatchObject({ outstanding: 0 });
    });

    test("a failed purchase recalculation rolls back the payment and its record", async () => {
      const product = await createProduct();
      const supplier = await createSupplier();
      const purchase = await createPurchase(supplier, product);
      const originalUpdateOne = Supplier.updateOne;
      const summaryWriteSpy = jest
        .spyOn(Supplier, "updateOne")
        .mockImplementationOnce(() => {
          throw new Error("simulated supplier summary failure");
        })
        .mockImplementation((...args) => originalUpdateOne.apply(Supplier, args));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      try {
        const response = await request(app)
          .post(`/api/purchases/${purchase._id}/payment`)
          .send({ amount: 10, method: "Cash", idempotencyKey: "purchase-rollback-1" });
        expect(response.status).toBe(500);
      } finally {
        consoleSpy.mockRestore();
        summaryWriteSpy.mockRestore();
      }

      const saved = await purchaseFromDb(purchase._id);
      expect(saved.payments).toHaveLength(0);
      expect(saved.paidAmount).toBe(0);
      expect(await supplierFromDb(supplier._id)).toMatchObject({ outstanding: 20 });
    });
  });

  describe("Phase 1 recalculation", () => {
    test("sale and purchase payments refresh only their own party summaries", async () => {
      const product = await createProduct();
      const customer = await createCustomer({ openingBalance: 4 });
      const otherCustomer = await createCustomer({ openingBalance: 6 });
      const supplier = await createSupplier({ openingBalance: 7 });
      const otherSupplier = await createSupplier({ openingBalance: 9 });
      const order = await createSale(customer, product, {
        paymentStatus: "partial",
        amountReceived: 5,
      });
      const purchase = await createPurchase(supplier, product, { paymentAmount: 5 });
      await createSale(otherCustomer, product);
      await createPurchase(otherSupplier, product);

      await request(app)
        .post(`/api/sale-orders/${order._id}/payment`)
        .send({ amount: 15, method: "Cash" });
      await request(app)
        .post(`/api/purchases/${purchase._id}/payment`)
        .send({ amount: 15, method: "Cash" });

      expect(await customerFromDb(customer._id)).toMatchObject({ orders: 1, totalPurchases: 20, outstanding: 4 });
      expect(await customerFromDb(otherCustomer._id)).toMatchObject({ orders: 1, totalPurchases: 20, outstanding: 26 });
      expect(await supplierFromDb(supplier._id)).toMatchObject({ totalPurchases: 20, outstanding: 7 });
      expect(await supplierFromDb(otherSupplier._id)).toMatchObject({ totalPurchases: 20, outstanding: 29 });
    });
  });

  describe("tenant isolation", () => {
    const previousAuth = process.env.AUTH_ENFORCEMENT;
    const previousTenant = process.env.TENANT_ENFORCEMENT;

    beforeAll(async () => {
      process.env.AUTH_ENFORCEMENT = "true";
      process.env.TENANT_ENFORCEMENT = "true";
    });

    afterAll(async () => {
      process.env.AUTH_ENFORCEMENT = previousAuth;
      process.env.TENANT_ENFORCEMENT = previousTenant;
    });

    test("a foreign tenant cannot pay a sale order", async () => {
      const businessA = await createBusiness({ name: "Pay A", slug: `pay-a-${randomSuffix()}` });
      const businessB = await createBusiness({ name: "Pay B", slug: `pay-b-${randomSuffix()}` });
      const emailA = `pay-a-${randomSuffix()}@example.com`;
      const emailB = `pay-b-${randomSuffix()}@example.com`;
      await createUser({ business: businessA, email: emailA, role: "owner" });
      await createUser({ business: businessB, email: emailB, role: "owner" });
      const cookieA = await loginAs(emailA);
      const cookieB = await loginAs(emailB);
      const createdProduct = await request(app)
        .post("/api/products")
        .set("Cookie", cookieA)
        .send({
          title: "Tenant A Product",
          sku: `PAY-T-${randomSuffix()}`,
          category: "Test",
          brand: "Test",
          openingStock: 50,
          reorderThreshold: 5,
          wholesalePrice: 10,
          purchasePrice: 5,
        });
      expect(createdProduct.status).toBe(201);
      const createdCustomer = await request(app)
        .post("/api/customers")
        .set("Cookie", cookieA)
        .send(customerPayload({ openingBalance: 20 }));
      expect(createdCustomer.status).toBe(201);
      const createdSale = await request(app)
        .post("/api/sale-orders")
        .set("Cookie", cookieA)
        .send(salePayload(createdCustomer.body.customer, createdProduct.body.product));
      expect(createdSale.status).toBe(201);

      const response = await request(app)
        .post(`/api/sale-orders/${createdSale.body.order._id}/payment`)
        .set("Cookie", cookieB)
        .send({ amount: 10, method: "Cash", idempotencyKey: "cross-tenant-sale" });
      expect(response.status).toBe(404);

      const saved = await saleFromDb(createdSale.body.order._id);
      expect(saved.payments).toHaveLength(0);
      expect(saved.financials).toMatchObject({ paid: 0, outstanding: 20 });
      expect(await customerFromDb(createdCustomer.body.customer._id)).toMatchObject({ outstanding: 40 });
    });

    test("a foreign tenant cannot pay a purchase", async () => {
      const businessA = await createBusiness({ name: "Pay C", slug: `pay-c-${randomSuffix()}` });
      const businessB = await createBusiness({ name: "Pay D", slug: `pay-d-${randomSuffix()}` });
      const emailA = `pay-c-${randomSuffix()}@example.com`;
      const emailB = `pay-d-${randomSuffix()}@example.com`;
      await createUser({ business: businessA, email: emailA, role: "owner" });
      await createUser({ business: businessB, email: emailB, role: "owner" });
      const cookieA = await loginAs(emailA);
      const cookieB = await loginAs(emailB);
      const createdProduct = await request(app)
        .post("/api/products")
        .set("Cookie", cookieA)
        .send({
          title: "Tenant A Purchase Product",
          sku: `PAY-TP-${randomSuffix()}`,
          category: "Test",
          brand: "Test",
          openingStock: 50,
          reorderThreshold: 5,
          purchasePrice: 10,
          wholesalePrice: 20,
        });
      expect(createdProduct.status).toBe(201);
      const createdSupplier = await request(app)
        .post("/api/suppliers")
        .set("Cookie", cookieA)
        .send(supplierPayload({ openingBalance: 20 }));
      expect(createdSupplier.status).toBe(201);
      const createdPurchase = await request(app)
        .post("/api/purchases")
        .set("Cookie", cookieA)
        .send(purchasePayload(createdSupplier.body.supplier, createdProduct.body.product));
      expect(createdPurchase.status).toBe(201);

      const response = await request(app)
        .post(`/api/purchases/${createdPurchase.body.purchase._id}/payment`)
        .set("Cookie", cookieB)
        .send({ amount: 10, method: "Cash", idempotencyKey: "cross-tenant-purchase" });
      expect(response.status).toBe(404);

      const saved = await purchaseFromDb(createdPurchase.body.purchase._id);
      expect(saved.payments).toHaveLength(0);
      expect(saved.paidAmount).toBe(0);
      expect(await supplierFromDb(createdSupplier.body.supplier._id)).toMatchObject({ outstanding: 40 });
    });
  });
});
