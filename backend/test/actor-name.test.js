const request = require("supertest");
const app = require("../src/app");
const { resolveActorName } = require("../src/utils/actor");
const { createBusiness, createUser } = require("./helpers/auth");
const { connectTestDB, clearTestDB, disconnectTestDB } = require("./helpers/test-db");

function cookieHeader(response) {
  const cookies = response.headers["set-cookie"] || [];
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function loginAs(email, password = "Password123!") {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  return cookieHeader(response);
}

describe("actor name resolver", () => {
  test("prefers the authenticated owner name over client input", () => {
    expect(resolveActorName({ auth: { ownerName: "Noor Ahmed" } }, "Spoofed Owner")).toBe(
      "Noor Ahmed"
    );
    expect(resolveActorName({ user: { name: "Noor Ahmed" } })).toBe("Noor Ahmed");
    expect(resolveActorName({})).toBe("System");
  });
});

describe("actor names on created records", () => {
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

  async function seed() {
    const business = await createBusiness({
      name: "Noor Traders",
      slug: "noor-traders-actor-test",
    });
    await createUser({
      business,
      email: "actor@example.com",
      role: "owner",
      name: "Noor Ahmed (Owner)",
    });
    return { business, cookie: await loginAs("actor@example.com") };
  }

  test("customer and supplier ignore submitted createdBy", async () => {
    const { cookie } = await seed();

    const customer = await request(app)
      .post("/api/customers")
      .set("Cookie", cookie)
      .send({
        name: "Cust",
        businessName: "Cust Biz",
        phone: "+92 3001234567",
        city: "Lahore",
        address: "Addr",
        customerType: "Wholesale",
        status: "Active",
        route: "unassigned",
        creditLimit: 100000,
        paymentTerms: "cod",
        createdBy: "Spoofed Owner",
      });
    expect(customer.status).toBe(201);
    expect(customer.body.customer.createdBy).toBe("Noor Ahmed (Owner)");

    const supplier = await request(app)
      .post("/api/suppliers")
      .set("Cookie", cookie)
      .send({
        name: "Sup",
        contactPerson: "CP",
        phone: "+92 3001234567",
        address: "Addr",
        paymentTerms: "net-30",
        createdBy: "Spoofed Owner",
      });
    expect(supplier.status).toBe(201);
    expect(supplier.body.supplier.createdBy).toBe("Noor Ahmed (Owner)");
  });

  test("stock movements and transaction receipts use the business name", async () => {
    const { cookie } = await seed();

    const productResponse = await request(app)
      .post("/api/products")
      .set("Cookie", cookie)
      .send({
        title: "Actor Test Product",
        sku: `ACTOR-${Date.now()}`,
        category: "Cat",
        brand: "Brand",
        openingStock: 20,
        reorderThreshold: 5,
        purchasePrice: 80,
        wholesalePrice: 100,
        retailPrice: 120,
        priceUnit: "Piece",
      });
    expect(productResponse.status).toBe(201);
    const product = productResponse.body.product;

    const supplierResponse = await request(app)
      .post("/api/suppliers")
      .set("Cookie", cookie)
      .send({
        name: "Sup",
        contactPerson: "CP",
        phone: "+92 3001234567",
        address: "Addr",
        paymentTerms: "net-30",
      });
    expect(supplierResponse.status).toBe(201);

    const purchase = await request(app)
      .post("/api/purchases")
      .set("Cookie", cookie)
      .send({
        supplierId: supplierResponse.body.supplier._id,
        purchaseDate: new Date().toISOString(),
        expectedDelivery: new Date().toISOString(),
        status: "Received",
        createdBy: "Spoofed Owner",
        performedBy: "Spoofed Owner",
        items: [
          {
            productId: product._id,
            name: product.title,
            sku: product.sku,
            quantity: 2,
            unit: "Piece",
            unitPrice: 80,
            discount: 0,
            taxRate: 0,
          },
        ],
      });
    expect(purchase.status).toBe(201);
    expect(purchase.body.purchase.createdBy).toBe("Noor Ahmed (Owner)");
    expect(purchase.body.purchase.items[0].receipts[0].performedBy).toBe("Noor Ahmed (Owner)");

    const sale = await request(app)
      .post("/api/sale-orders")
      .set("Cookie", cookie)
      .send({
        customer: "Walk-in Customer",
        phone: "+92 3001234567",
        paymentStatus: "unpaid",
        status: "Pending Approval",
        createdBy: "Spoofed Owner",
        items: [
          {
            name: product.title,
            sku: product.sku,
            productId: product._id,
            quantity: 1,
            unitLabel: "Piece",
            unitPrice: 120,
          },
        ],
      });
    expect(sale.status).toBe(201);
    expect(sale.body.order.createdBy).toBe("Noor Ahmed (Owner)");

    const adjustment = await request(app)
      .post(`/api/products/${product._id}/adjust-stock`)
      .set("Cookie", cookie)
      .send({
        direction: "add",
        quantity: 1,
        unit: "Piece",
        reason: "Cycle count",
        performedBy: "Spoofed Owner",
      });
    expect(adjustment.status).toBe(201);
    expect(adjustment.body.movement.performedBy).toBe("Noor Ahmed (Owner)");

    const movements = await request(app)
      .get("/api/inventory/movements")
      .set("Cookie", cookie);
    expect(movements.status).toBe(200);
    expect(movements.body.movements.length).toBeGreaterThanOrEqual(3);
    expect(
      movements.body.movements.every((movement) => movement.performedBy === "Noor Ahmed (Owner)")
    ).toBe(true);
  });
});
