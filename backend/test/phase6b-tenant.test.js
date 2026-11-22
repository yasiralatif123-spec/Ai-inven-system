const request = require("supertest");
const app = require("../src/app");
const Product = require("../src/models/Product");
const Supplier = require("../src/models/Supplier");
const Customer = require("../src/models/Customer");
const Purchase = require("../src/models/Purchase");
const SaleOrder = require("../src/models/SaleOrder");
const { createBusiness, createUser } = require("./helpers/auth");
const { connectTestDB, clearTestDB, disconnectTestDB } = require("./helpers/test-db");

function cookieHeader(response) {
  const cookies = response.headers["set-cookie"] || [];
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function loginAs(email, password = "Password123!") {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return cookieHeader(res);
}

async function createProduct(cookie, overrides = {}) {
  const payload = { title: "P", sku: `SKU-${Math.random().toString(36).slice(2, 8)}`, category: "Cat", brand: "Brand", openingStock: 20, wholesalePrice: 100, purchasePrice: 80, ...overrides };
  const res = await request(app).post("/api/products").set("Cookie", cookie).send(payload);
  expect(res.status).toBe(201);
  return res.body.product;
}

async function createSupplier(cookie, overrides = {}) {
  const payload = { name: "Sup", contactPerson: "CP", phone: "+92 3001234567", address: "Addr", paymentTerms: "net-30", ...overrides };
  const res = await request(app).post("/api/suppliers").set("Cookie", cookie).send(payload);
  expect(res.status).toBe(201);
  return res.body.supplier;
}

async function createCustomer(cookie, overrides = {}) {
  const payload = { name: "Cust", businessName: "Biz", phone: "+92 3001234567", city: "Lahore", address: "Addr", customerType: "Wholesale", status: "Active", route: "unassigned", creditLimit: 100000, paymentTerms: "cod", ...overrides };
  const res = await request(app).post("/api/customers").set("Cookie", cookie).send(payload);
  expect(res.status).toBe(201);
  return res.body.customer;
}

describe("Phase 6 Part B - supplier/customer/purchase/sale tenant enforcement", () => {
  const prevAuth = process.env.AUTH_ENFORCEMENT;
  const prevTenant = process.env.TENANT_ENFORCEMENT;

  beforeAll(async () => {
    process.env.AUTH_ENFORCEMENT = "true";
    process.env.TENANT_ENFORCEMENT = "true";
    await connectTestDB();
    // Drop old global unique indexes if present in test DB
    for (const [model, name, key] of [
      [Supplier, "supplierCode_1", { supplierCode: 1 }],
      [Customer, "ledgerCode_1", { ledgerCode: 1 }],
      [Purchase, "purchaseNumber_1", { purchaseNumber: 1 }],
      [SaleOrder, "orderNumber_1", { orderNumber: 1 }],
    ]) {
      try {
        const indexes = await model.collection.indexes();
        const old = indexes.find((idx) => idx.unique && idx.name === name && Object.keys(idx.key).length === 1 && idx.key[Object.keys(key)[0]] === 1);
        if (old) await model.collection.dropIndex(old.name);
      } catch (e) { if (e?.codeName !== "NamespaceNotFound") throw e; }
      await model.syncIndexes();
    }
  });

  afterEach(async () => { await clearTestDB(); });
  afterAll(async () => {
    process.env.AUTH_ENFORCEMENT = prevAuth;
    process.env.TENANT_ENFORCEMENT = prevTenant;
    await disconnectTestDB();
  });

  async function seed() {
    const businessA = await createBusiness({ name: "Biz A", slug: "biz-a" });
    const businessB = await createBusiness({ name: "Biz B", slug: "biz-b" });
    await createUser({ business: businessA, email: "a@example.com", role: "owner", name: "A" });
    await createUser({ business: businessB, email: "b@example.com", role: "owner", name: "B" });
    const cookieA = await loginAs("a@example.com");
    const cookieB = await loginAs("b@example.com");
    return { businessA, businessB, cookieA, cookieB };
  }

  test("unauthenticated gets 401 when AUTH_ENFORCEMENT=true", async () => {
    await request(app).get("/api/suppliers").expect(401);
    await request(app).get("/api/customers").expect(401);
    await request(app).get("/api/purchases").expect(401);
    await request(app).get("/api/sale-orders").expect(401);
  });

  test("A cannot read/update/delete B supplier/customer; lists return own rows", async () => {
    const { cookieA, cookieB } = await seed();
    const supB = await createSupplier(cookieB, { name: "SupB" });
    const cusB = await createCustomer(cookieB, { name: "CusB", businessName: "CusB Biz" });

    await request(app).get(`/api/suppliers/${supB._id}`).set("Cookie", cookieA).expect(404);
    await request(app).get(`/api/suppliers/code/${supB.supplierCode}`).set("Cookie", cookieA).expect(404);
    await request(app).put(`/api/suppliers/${supB._id}`).set("Cookie", cookieA).send({ name: "X", contactPerson: "C", phone: "+92 3001234567", address: "A", paymentTerms: "net-30" }).expect(404);
    await request(app).delete(`/api/suppliers/${supB._id}`).set("Cookie", cookieA).expect(404);

    await request(app).get(`/api/customers/${cusB._id}`).set("Cookie", cookieA).expect(404);
    await request(app).get(`/api/customers/code/${cusB.ledgerCode}`).set("Cookie", cookieA).expect(404);
    await request(app).delete(`/api/customers/${cusB._id}`).set("Cookie", cookieA).expect(404);

    const supListA = await request(app).get("/api/suppliers").set("Cookie", cookieA);
    const cusListA = await request(app).get("/api/customers").set("Cookie", cookieA);
    expect(supListA.body.suppliers).toHaveLength(0);
    expect(cusListA.body.customers).toHaveLength(0);
  });

  test("A cannot read/update/delete B purchase and sale order by id and number", async () => {
    const { cookieA, cookieB } = await seed();
    const prodB = await createProduct(cookieB, { sku: "B-SKU" });
    const supB = await createSupplier(cookieB, { name: "SupB" });
    const cusB = await createCustomer(cookieB, { name: "CusB", businessName: "CusB Biz" });

    const purRes = await request(app).post("/api/purchases").set("Cookie", cookieB).send({
      supplierId: supB._id, purchaseDate: new Date().toISOString(), expectedDelivery: new Date().toISOString(),
      status: "Draft", items: [{ productId: prodB._id, name: prodB.title, sku: prodB.sku, quantity: 1, unitPrice: 80, discount: 0, taxRate: 0 }],
    });
    expect(purRes.status).toBe(201);
    const purB = purRes.body.purchase;

    const saleRes = await request(app).post("/api/sale-orders").set("Cookie", cookieB).send({
      customer: { customerId: cusB._id, name: cusB.name, phone: cusB.phone }, paymentStatus: "unpaid", status: "Pending Approval",
      items: [{ productId: prodB._id, sku: prodB.sku, name: prodB.title, quantity: 1, unitPrice: 100, flavor: [] }],
    });
    expect(saleRes.status).toBe(201);
    const saleB = saleRes.body.order;

    await request(app).get(`/api/purchases/${purB._id}`).set("Cookie", cookieA).expect(404);
    await request(app).get(`/api/purchases/number/${purB.purchaseNumber}`).set("Cookie", cookieA).expect(404);
    await request(app).delete(`/api/purchases/${purB._id}`).set("Cookie", cookieA).expect(404);

    await request(app).get(`/api/sale-orders/${saleB._id}`).set("Cookie", cookieA).expect(404);
    await request(app).get(`/api/sale-orders/number/${saleB.orderNumber}`).set("Cookie", cookieA).expect(404);
    await request(app).delete(`/api/sale-orders/${saleB._id}`).set("Cookie", cookieA).expect(404);
  });

  test("A cannot create purchase/sale with B's entities; stock never touches B", async () => {
    const { cookieA, cookieB } = await seed();
    const prodA = await createProduct(cookieA, { sku: "A-SKU", openingStock: 10 });
    const prodB = await createProduct(cookieB, { sku: "B-SKU", openingStock: 10 });
    const supB = await createSupplier(cookieB, { name: "SupB" });
    const cusB = await createCustomer(cookieB, { name: "CusB", businessName: "CusB Biz" });

    // A tries purchase with B supplier
    const purBadSup = await request(app).post("/api/purchases").set("Cookie", cookieA).send({
      supplierId: supB._id, purchaseDate: new Date().toISOString(), expectedDelivery: new Date().toISOString(),
      status: "Draft", items: [{ productId: prodA._id, name: prodA.title, sku: prodA.sku, quantity: 1, unitPrice: 80, discount: 0, taxRate: 0 }],
    });
    expect([400, 404, 422]).toContain(purBadSup.status);

    // A tries purchase with B product
    const supA = await createSupplier(cookieA, { name: "SupA" });
    const purBadProd = await request(app).post("/api/purchases").set("Cookie", cookieA).send({
      supplierId: supA._id, purchaseDate: new Date().toISOString(), expectedDelivery: new Date().toISOString(),
      status: "Draft", items: [{ productId: prodB._id, name: prodB.title, sku: prodB.sku, quantity: 1, unitPrice: 80, discount: 0, taxRate: 0 }],
    });
    expect([400, 404, 422]).toContain(purBadProd.status);

    // A tries sale with B customer or B product
    const cusA = await createCustomer(cookieA, { name: "CusA", businessName: "CusA Biz" });
    const saleBadCus = await request(app).post("/api/sale-orders").set("Cookie", cookieA).send({
      customer: { customerId: cusB._id, name: cusB.name, phone: cusB.phone }, paymentStatus: "unpaid", status: "Pending Approval",
      items: [{ productId: prodA._id, sku: prodA.sku, name: prodA.title, quantity: 1, unitPrice: 100, flavor: [] }],
    });
    expect([400, 404, 422]).toContain(saleBadCus.status);

    const saleBadProd = await request(app).post("/api/sale-orders").set("Cookie", cookieA).send({
      customer: { customerId: cusA._id, name: cusA.name, phone: cusA.phone }, paymentStatus: "unpaid", status: "Pending Approval",
      items: [{ productId: prodB._id, sku: prodB.sku, name: prodB.title, quantity: 1, unitPrice: 100, flavor: [] }],
    });
    expect([400, 404, 422]).toContain(saleBadProd.status);

    // B's stock untouched
    const prodBAfter = await request(app).get(`/api/products/${prodB._id}`).set("Cookie", cookieB);
    expect(prodBAfter.body.product.openingStock).toBe(10);
  });

  test("numbers/codes generated per business and duplicates allowed across businesses; lists return own rows only", async () => {
    const { cookieA, cookieB } = await seed();
    const supA = await createSupplier(cookieA, { name: "SupA" });
    const supB = await createSupplier(cookieB, { name: "SupB" });
    const cusA = await createCustomer(cookieA, { name: "CusA", businessName: "CusA Biz" });
    const cusB = await createCustomer(cookieB, { name: "CusB", businessName: "CusB Biz" });
    const prodA = await createProduct(cookieA, { sku: "A-SKU" });
    const prodB = await createProduct(cookieB, { sku: "B-SKU" });

    // Same code/number values allowed across businesses (fresh DB, same sequence base)
    expect(supA.supplierCode).toBe(supB.supplierCode);
    expect(cusA.ledgerCode).toBe(cusB.ledgerCode);

    const purA = await request(app).post("/api/purchases").set("Cookie", cookieA).send({
      supplierId: supA._id, purchaseDate: new Date().toISOString(), expectedDelivery: new Date().toISOString(), status: "Draft",
      items: [{ productId: prodA._id, name: prodA.title, sku: prodA.sku, quantity: 1, unitPrice: 80, discount: 0, taxRate: 0 }],
    });
    const purB = await request(app).post("/api/purchases").set("Cookie", cookieB).send({
      supplierId: supB._id, purchaseDate: new Date().toISOString(), expectedDelivery: new Date().toISOString(), status: "Draft",
      items: [{ productId: prodB._id, name: prodB.title, sku: prodB.sku, quantity: 1, unitPrice: 80, discount: 0, taxRate: 0 }],
    });
    expect(purA.status).toBe(201);
    expect(purB.status).toBe(201);
    expect(purA.body.purchase.purchaseNumber).toBe(purB.body.purchase.purchaseNumber);

    const saleA = await request(app).post("/api/sale-orders").set("Cookie", cookieA).send({
      customer: { customerId: cusA._id, name: cusA.name, phone: cusA.phone }, paymentStatus: "unpaid", status: "Pending Approval",
      items: [{ productId: prodA._id, sku: prodA.sku, name: prodA.title, quantity: 1, unitPrice: 100, flavor: [] }],
    });
    const saleB = await request(app).post("/api/sale-orders").set("Cookie", cookieB).send({
      customer: { customerId: cusB._id, name: cusB.name, phone: cusB.phone }, paymentStatus: "unpaid", status: "Pending Approval",
      items: [{ productId: prodB._id, sku: prodB.sku, name: prodB.title, quantity: 1, unitPrice: 100, flavor: [] }],
    });
    expect(saleA.status).toBe(201);
    expect(saleB.status).toBe(201);
    expect(saleA.body.order.orderNumber).toBe(saleB.body.order.orderNumber);

    // Lists return own rows only
    const [sA, sB, cA, cB, pA, pB, oA, oB] = await Promise.all([
      request(app).get("/api/suppliers").set("Cookie", cookieA),
      request(app).get("/api/suppliers").set("Cookie", cookieB),
      request(app).get("/api/customers").set("Cookie", cookieA),
      request(app).get("/api/customers").set("Cookie", cookieB),
      request(app).get("/api/purchases").set("Cookie", cookieA),
      request(app).get("/api/purchases").set("Cookie", cookieB),
      request(app).get("/api/sale-orders").set("Cookie", cookieA),
      request(app).get("/api/sale-orders").set("Cookie", cookieB),
    ]);
    expect(sA.body.suppliers.map((x) => x._id)).toEqual([supA._id]);
    expect(sB.body.suppliers.map((x) => x._id)).toEqual([supB._id]);
    expect(cA.body.customers.map((x) => x._id)).toEqual([cusA._id]);
    expect(cB.body.customers.map((x) => x._id)).toEqual([cusB._id]);
    expect(pA.body.purchases).toHaveLength(1);
    expect(pB.body.purchases).toHaveLength(1);
    expect(pA.body.purchases[0]._id).toBe(purA.body.purchase._id);
    expect(pB.body.purchases[0]._id).toBe(purB.body.purchase._id);
    expect(oA.body.orders).toHaveLength(1);
    expect(oB.body.orders).toHaveLength(1);
    expect(oA.body.orders[0]._id).toBe(saleA.body.order._id);
    expect(oB.body.orders[0]._id).toBe(saleB.body.order._id);
  });
});
