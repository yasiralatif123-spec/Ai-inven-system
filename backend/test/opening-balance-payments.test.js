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

function cookieHeader(response) {
  const cookies = response.headers["set-cookie"] || [];
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function loginAs(email, password = "Password123!") {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  expect(response.status).toBe(200);
  return cookieHeader(response);
}

async function createProduct(cookie, overrides = {}) {
  const payload = {
    title: "Opening Balance Widget",
    sku: `OB-${randomSuffix().toUpperCase()}`,
    category: "Test",
    brand: "Test Brand",
    openingStock: 100,
    reorderThreshold: 5,
    priceUnit: "Piece",
    uom: "Piece",
    purchasePrice: 10,
    wholesalePrice: 10,
    retailPrice: 20,
    ...overrides,
  };
  const req = request(app).post("/api/products");
  if (cookie) req.set("Cookie", cookie);
  const response = await req.send(payload);
  expect(response.status).toBe(201);
  return response.body.product;
}

async function createCustomer(cookie, overrides = {}) {
  const payload = {
    name: "Opening Balance Customer",
    businessName: `OB Traders ${randomSuffix()}`,
    phone: "+92 3001234567",
    city: "Lahore",
    address: "Test Address",
    customerType: "Wholesale",
    status: "Active",
    route: "unassigned",
    creditLimit: 100000,
    paymentTerms: "cod",
    openingBalance: 100,
    ...overrides,
  };
  const req = request(app).post("/api/customers");
  if (cookie) req.set("Cookie", cookie);
  const response = await req.send(payload);
  expect(response.status).toBe(201);
  return response.body.customer;
}

async function createSupplier(cookie, overrides = {}) {
  const payload = {
    name: `Opening Balance Supplier ${randomSuffix()}`,
    contactPerson: "Contact",
    phone: "+92 3001234567",
    address: "Test Address",
    paymentTerms: "net-30",
    openingBalance: 100,
    ...overrides,
  };
  const req = request(app).post("/api/suppliers");
  if (cookie) req.set("Cookie", cookie);
  const response = await req.send(payload);
  expect(response.status).toBe(201);
  return response.body.supplier;
}

async function createSale(cookie, customer, product) {
  const req = request(app).post("/api/sale-orders");
  if (cookie) req.set("Cookie", cookie);
  const response = await req.send({
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
  });
  expect(response.status).toBe(201);
  return response.body.order;
}

async function createPurchase(cookie, supplier, product) {
  const req = request(app).post("/api/purchases");
  if (cookie) req.set("Cookie", cookie);
  const response = await req.send({
    supplierId: String(supplier._id),
    purchaseDate: "2026-01-01",
    expectedDelivery: "2026-01-05",
    invoiceNumber: `INV-${randomSuffix()}`,
    status: "Draft",
    freight: 0,
    paymentAmount: 0,
    items: [
      {
        name: product.title,
        sku: product.sku,
        productId: String(product._id),
        quantity: 2,
        unit: "Piece",
        unitPrice: 999,
        discount: 0,
        taxRate: 0,
      },
    ],
  });
  expect(response.status).toBe(201);
  return response.body.purchase;
}

function payCustomer(cookie, id, amount, idempotencyKey, extra = {}) {
  const req = request(app).post(
    `/api/customers/${id}/opening-balance-payments`
  );
  if (cookie) req.set("Cookie", cookie);
  if (idempotencyKey) req.set("Idempotency-Key", idempotencyKey);
  return req.send({ amount, method: "Cash", ...extra });
}

function paySupplier(cookie, id, amount, idempotencyKey, extra = {}) {
  const req = request(app).post(
    `/api/suppliers/${id}/opening-balance-payments`
  );
  if (cookie) req.set("Cookie", cookie);
  if (idempotencyKey) req.set("Idempotency-Key", idempotencyKey);
  return req.send({ amount, method: "Cash", ...extra });
}

describe("opening balance payment ledger", () => {
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

  test("customer opening payment reduces only the opening portion of outstanding", async () => {
    const product = await createProduct(null);
    const customer = await createCustomer(null);
    await createSale(null, customer, product);

    const response = await payCustomer(null, customer._id, 40, "cust-partial-1");
    expect(response.status).toBe(200);
    expect(response.body.customer).toMatchObject({
      openingBalance: 100,
      openingBalancePaid: 40,
      remainingOpeningBalance: 60,
      outstanding: 80,
    });

    const saved = await Customer.findById(customer._id).lean();
    expect(saved.openingBalance).toBe(100);
    expect(saved.openingBalancePaid).toBe(40);
    expect(saved.remainingOpeningBalance).toBe(60);
    expect(saved.outstanding).toBe(80);
    expect(saved.openingBalancePayments).toHaveLength(1);
    expect(saved.openingBalancePayments[0]).toMatchObject({
      amount: 40,
      kind: "payment",
      createdBy: "System",
      idempotencyKey: "cust-partial-1",
    });

    const sale = await SaleOrder.findOne().lean();
    expect(sale.financials.paid).toBe(0);
    expect(sale.financials.outstanding).toBe(20);
    expect(sale.payments).toHaveLength(0);

    const deleteResponse = await request(app).delete(`/api/customers/${customer._id}`);
    expect(deleteResponse.status).toBe(409);
  });

  test("full customer opening payment leaves sale outstanding and delete still blocked", async () => {
    const product = await createProduct(null);
    const customer = await createCustomer(null);
    await createSale(null, customer, product);

    expect((await payCustomer(null, customer._id, 60, "cust-full-a")).status).toBe(200);
    const response = await payCustomer(null, customer._id, 40, "cust-full-b");
    expect(response.status).toBe(200);
    expect(response.body.customer).toMatchObject({
      openingBalance: 100,
      openingBalancePaid: 100,
      remainingOpeningBalance: 0,
      outstanding: 20,
    });

    expect((await request(app).delete(`/api/customers/${customer._id}`)).status).toBe(409);
  });

  test("supplier opening payment reduces only the opening portion of payable", async () => {
    const product = await createProduct(null);
    const supplier = await createSupplier(null);
    await createPurchase(null, supplier, product);

    const response = await paySupplier(null, supplier._id, 40, "sup-partial-1");
    expect(response.status).toBe(200);
    expect(response.body.supplier).toMatchObject({
      openingBalance: 100,
      openingBalancePaid: 40,
      remainingOpeningBalance: 60,
      outstanding: 80,
    });

    const saved = await Supplier.findById(supplier._id).lean();
    expect(saved.openingBalance).toBe(100);
    expect(saved.openingBalancePaid).toBe(40);
    expect(saved.remainingOpeningBalance).toBe(60);
    expect(saved.outstanding).toBe(80);
    expect(saved.openingBalancePayments).toHaveLength(1);

    const purchase = await Purchase.findOne().lean();
    expect(purchase.paidAmount).toBe(0);
    expect(purchase.payments).toHaveLength(0);

    expect((await request(app).delete(`/api/suppliers/${supplier._id}`)).status).toBe(409);
  });

  test("overpayment and unsupported methods are rejected without appending records", async () => {
    const customer = await createCustomer(null);
    const supplier = await createSupplier(null);

    const overpay = await payCustomer(null, customer._id, 101, "cust-overpay");
    expect(overpay.status).toBe(400);
    expect(overpay.body.message).toMatch(/cannot exceed/i);

    const badMethod = await paySupplier(null, supplier._id, 10, "sup-bad-method", {
      method: "Crypto",
    });
    expect(badMethod.status).toBe(400);
    expect(badMethod.body.message).toMatch(/unsupported payment method/i);

    expect((await Customer.findById(customer._id).lean()).openingBalancePayments).toHaveLength(0);
    expect((await Supplier.findById(supplier._id).lean()).openingBalancePayments).toHaveLength(0);
  });

  test("concurrent duplicate idempotency keys append one record", async () => {
    const customer = await createCustomer(null);
    const responses = await Promise.all([
      payCustomer(null, customer._id, 30, "cust-dup-key"),
      payCustomer(null, customer._id, 30, "cust-dup-key"),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);

    const saved = await Customer.findById(customer._id).lean();
    expect(saved.openingBalancePayments).toHaveLength(1);
    expect(saved.openingBalancePaid).toBe(30);
    expect(saved.remainingOpeningBalance).toBe(70);

    const conflict = await payCustomer(null, customer._id, 50, "cust-dup-key");
    expect(conflict.status).toBe(409);
  });

  test("concurrent overpayments are blocked by conditional updates", async () => {
    const supplier = await createSupplier(null, { openingBalance: 50 });
    const responses = await Promise.all([
      paySupplier(null, supplier._id, 30, "sup-race-a"),
      paySupplier(null, supplier._id, 30, "sup-race-b"),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 400]);

    const saved = await Supplier.findById(supplier._id).lean();
    expect(saved.openingBalancePayments).toHaveLength(1);
    expect(saved.openingBalancePaid).toBe(30);
    expect(saved.remainingOpeningBalance).toBe(20);
  });

  test("reversals are append-only and cannot exceed the original payment", async () => {
    const customer = await createCustomer(null);
    const payment = await payCustomer(null, customer._id, 40, "cust-reverse-source");
    expect(payment.status).toBe(200);
    const recordId = String(payment.body.customer.openingBalancePayments[0]._id);

    const reversal = await request(app)
      .post(`/api/customers/${customer._id}/opening-balance-payments/${recordId}/reversal`)
      .set("Idempotency-Key", "cust-reverse-1")
      .send({ amount: 15, method: "Cash", reference: "Correction" });
    expect(reversal.status).toBe(200);
    expect(reversal.body.customer).toMatchObject({
      openingBalancePaid: 25,
      remainingOpeningBalance: 75,
      outstanding: 75,
    });

    const saved = await Customer.findById(customer._id).lean();
    expect(saved.openingBalancePayments).toHaveLength(2);
    expect(saved.openingBalancePayments.map((row) => row.kind).sort()).toEqual([
      "payment",
      "reversal",
    ]);

    const tooLarge = await request(app)
      .post(`/api/customers/${customer._id}/opening-balance-payments/${recordId}/reversal`)
      .set("Idempotency-Key", "cust-reverse-too-large")
      .send({ amount: 30, method: "Cash" });
    expect(tooLarge.status).toBe(400);
  });

  describe("tenant isolation", () => {
    const previousAuth = process.env.AUTH_ENFORCEMENT;
    const previousTenant = process.env.TENANT_ENFORCEMENT;

    beforeAll(async () => {
      process.env.AUTH_ENFORCEMENT = "true";
      process.env.TENANT_ENFORCEMENT = "true";
      await clearTestDB();
    });

    afterAll(async () => {
      process.env.AUTH_ENFORCEMENT = previousAuth;
      process.env.TENANT_ENFORCEMENT = previousTenant;
      await clearTestDB();
    });

    test("cross-tenant opening payments are rejected and actor comes from auth", async () => {
      const businessA = await createBusiness({ name: "Biz A", slug: "ob-biz-a" });
      const businessB = await createBusiness({ name: "Biz B", slug: "ob-biz-b" });
      await createUser({ business: businessA, email: "oba@example.com", name: "Owner A" });
      await createUser({ business: businessB, email: "obb@example.com", name: "Owner B" });
      const cookieA = await loginAs("oba@example.com");
      const cookieB = await loginAs("obb@example.com");

      const customerB = await createCustomer(cookieB, { openingBalance: 100 });
      const supplierB = await createSupplier(cookieB, { openingBalance: 100 });

      expect((await payCustomer(cookieA, customerB._id, 10, "cross-cust")).status).toBe(404);
      expect((await paySupplier(cookieA, supplierB._id, 10, "cross-sup")).status).toBe(404);
      expect((await Customer.findById(customerB._id).lean()).openingBalancePayments).toHaveLength(0);
      expect((await Supplier.findById(supplierB._id).lean()).openingBalancePayments).toHaveLength(0);

      const owned = await payCustomer(cookieB, customerB._id, 25, "owned-cust");
      expect(owned.status).toBe(200);
      const saved = await Customer.findById(customerB._id).lean();
      expect(saved.openingBalancePayments).toHaveLength(1);
      expect(saved.openingBalancePayments[0].createdBy).toBe("Owner B");
    });
  });
});
