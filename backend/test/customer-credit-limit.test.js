const request = require("supertest");
const app = require("../src/app");
const Customer = require("../src/models/Customer");
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
} = require("./helpers/test-db");
const { customerSeed } = require("./helpers/customers");
const {
  NEAR_CREDIT_LIMIT_PERCENT,
  evaluateCustomerCreditLimit,
} = require("../src/utils/credit-limit-alerts");

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

function customerPayload(overrides = {}) {
  return {
    name: "Credit Limit Customer",
    businessName: `Credit Traders ${randomSuffix()}`,
    phone: `+92 300${Math.floor(1000000 + Math.random() * 9000000)}`,
    city: "Lahore",
    address: "Test Address",
    customerType: "Wholesale",
    status: "Active",
    route: "unassigned",
    paymentTerms: "15days",
    gracePeriod: "none",
    openingBalance: 0,
    ...overrides,
  };
}

async function createCustomerRequest(overrides = {}) {
  const response = await request(app)
    .post("/api/customers")
    .send(customerPayload(overrides));
  expect(response.status).toBe(201);
  return response.body.customer;
}

async function createProduct() {
  const response = await request(app).post("/api/products").send({
    title: "Credit Limit Widget",
    sku: `CL-${randomSuffix().toUpperCase()}`,
    category: "Test",
    brand: "Test Brand",
    openingStock: 500,
    reorderThreshold: 5,
    priceUnit: "Piece",
    uom: "Piece",
    purchasePrice: 5,
    wholesalePrice: 10,
    retailPrice: 20,
  });
  expect(response.status).toBe(201);
  return response.body.product;
}

describe("credit-limit alert calculations", () => {
  test("uses an 80 percent near-limit threshold", () => {
    expect(NEAR_CREDIT_LIMIT_PERCENT).toBe(80);

    expect(evaluateCustomerCreditLimit({ creditLimit: 1000, outstanding: 799 })).toMatchObject({
      creditStatus: "within",
      creditExposurePercent: 79.9,
      nearCreditLimit: false,
      creditLimitExceeded: false,
      availableCredit: 201,
    });

    expect(evaluateCustomerCreditLimit({ creditLimit: 1000, outstanding: 800 })).toMatchObject({
      creditStatus: "near",
      creditExposurePercent: 80,
      nearCreditLimit: true,
      creditLimitExceeded: false,
      availableCredit: 200,
    });
  });

  test("keeps an exact-limit balance within the limit and clamps available credit", () => {
    expect(evaluateCustomerCreditLimit({ creditLimit: 1000, outstanding: 1000 })).toMatchObject({
      creditStatus: "near",
      nearCreditLimit: true,
      creditLimitExceeded: false,
      availableCredit: 0,
    });

    expect(evaluateCustomerCreditLimit({ creditLimit: 1000, outstanding: 1001 })).toMatchObject({
      creditStatus: "exceeded",
      nearCreditLimit: false,
      creditLimitExceeded: true,
      availableCredit: 0,
    });
  });

  test("never alerts when the limit is zero", () => {
    expect(evaluateCustomerCreditLimit({ creditLimit: 0, outstanding: 5000 })).toEqual({
      hasLimit: false,
      creditStatus: "no-limit",
      nearCreditLimit: false,
      creditLimitExceeded: false,
      availableCredit: 0,
      creditExposurePercent: 0,
    });
  });
});

describe("customer credit limit API", () => {
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

  test("defaults a missing credit limit to zero", async () => {
    const customer = await createCustomerRequest();
    const saved = await Customer.findById(customer._id).lean();

    expect(customer.creditLimit).toBe(0);
    expect(customer.creditStatus).toBe("no-limit");
    expect(customer.nearCreditLimit).toBe(false);
    expect(customer.creditLimitExceeded).toBe(false);
    expect(saved.creditLimit).toBe(0);
  });

  test("accepts a finite non-negative monetary value", async () => {
    const customer = await createCustomerRequest({ creditLimit: "125,000.509" });

    expect(customer.creditLimit).toBe(125000.51);
    expect(customer.creditStatus).toBe("within");
  });

  test.each([-1, "abc", "Infinity", "NaN", {}])(
    "rejects invalid credit limit %p",
    async (creditLimit) => {
      const response = await request(app)
        .post("/api/customers")
        .send(customerPayload({ creditLimit }));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Trade credit limit must be a finite, non-negative number"
      );
    }
  );

  test("updates the credit limit while preserving frozen ledger fields", async () => {
    const customer = await createCustomerRequest({
      creditLimit: 500000,
      paymentTerms: "30days",
      gracePeriod: "5days",
      openingBalance: 250,
    });

    const response = await request(app)
      .put(`/api/customers/${customer._id}`)
      .send({ creditLimit: "750000.25", notes: "Updated credit ceiling" });

    expect(response.status).toBe(200);
    expect(response.body.customer.creditLimit).toBe(750000.25);
    expect(response.body.customer.notes).toBe("Updated credit ceiling");

    const saved = await Customer.findById(customer._id).lean();
    expect(saved.creditLimit).toBe(750000.25);
    expect(saved.ledgerCode).toBe(customer.ledgerCode);
    expect(saved.paymentTerms).toBe("30days");
    expect(saved.gracePeriod).toBe("5days");
    expect(saved.openingBalance).toBe(250);
    expect(saved.outstanding).toBe(250);
    expect(saved.openingBalancePayments).toHaveLength(0);
  });

  test("preserves an omitted credit limit and allows an explicit zero", async () => {
    const customer = await createCustomerRequest({ creditLimit: 300000 });

    const preserved = await request(app)
      .put(`/api/customers/${customer._id}`)
      .send({ notes: "Contact updated" });

    expect(preserved.status).toBe(200);
    expect(preserved.body.customer.creditLimit).toBe(300000);

    const cleared = await request(app)
      .put(`/api/customers/${customer._id}`)
      .send({ creditLimit: 0 });

    expect(cleared.status).toBe(200);
    expect(cleared.body.customer.creditLimit).toBe(0);
    expect(cleared.body.customer.creditStatus).toBe("no-limit");
    expect(cleared.body.customer.nearCreditLimit).toBe(false);
    expect(cleared.body.customer.creditLimitExceeded).toBe(false);
  });

  test("normalizes a legacy customer without a stored credit limit", async () => {
    const created = await Customer.create(customerSeed());
    await Customer.updateOne({ _id: created._id }, { $unset: { creditLimit: 1 } });

    const response = await request(app).get(`/api/customers/${created._id}`);

    expect(response.status).toBe(200);
    expect(response.body.customer.creditLimit).toBe(0);
    expect(response.body.customer.creditStatus).toBe("no-limit");

    const raw = await Customer.collection.findOne({ _id: created._id });
    expect(raw.creditLimit).toBeUndefined();
  });

  test("does not block a sale when the customer is over its credit limit", async () => {
    const customer = await createCustomerRequest({ creditLimit: 1 });
    const product = await createProduct();

    const sale = await request(app).post("/api/sale-orders").send({
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

    expect(sale.status).toBe(201);

    const profile = await request(app).get(`/api/customers/${customer._id}`);
    expect(profile.status).toBe(200);
    expect(profile.body.customer.creditLimitExceeded).toBe(true);
    expect(profile.body.customer.creditStatus).toBe("exceeded");
  });
});
