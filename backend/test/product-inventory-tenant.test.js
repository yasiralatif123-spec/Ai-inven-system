const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const Product = require("../src/models/Product");
const StockMovement = require("../src/models/StockMovement");
const { createBusiness, createUser } = require("./helpers/auth");
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
} = require("./helpers/test-db");

function cookieHeader(response) {
  const cookies = response.headers["set-cookie"] || [];
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function loginAs(email, password = "Password123!") {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  return cookieHeader(response);
}

async function createProductAs(cookie, overrides = {}) {
  const payload = {
    title: "Test Product",
    sku: `SKU-${Math.random().toString(36).slice(2, 8)}`,
    category: "Cat",
    brand: "Brand",
    openingStock: 10,
    ...overrides,
  };
  const response = await request(app)
    .post("/api/products")
    .set("Cookie", cookie)
    .send(payload);
  return response;
}

describe("Phase 6 Part A - product/inventory tenant enforcement", () => {
  const prevAuth = process.env.AUTH_ENFORCEMENT;
  const prevTenant = process.env.TENANT_ENFORCEMENT;

  beforeAll(async () => {
    process.env.AUTH_ENFORCEMENT = "true";
    process.env.TENANT_ENFORCEMENT = "true";
    await connectTestDB();

    // Ensure test DB does not retain the old global sku unique index.
    try {
      const indexes = await Product.collection.indexes();
      const hasOldSku = indexes.some(
        (idx) => idx.name === "sku_1" && idx.unique && idx.key?.sku === 1 && Object.keys(idx.key).length === 1
      );
      if (hasOldSku) {
        await Product.collection.dropIndex("sku_1");
      }
    } catch (error) {
      if (error?.codeName !== "NamespaceNotFound") throw error;
    }
    await Product.syncIndexes();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    process.env.AUTH_ENFORCEMENT = prevAuth;
    process.env.TENANT_ENFORCEMENT = prevTenant;
    await disconnectTestDB();
  });

  async function seedTwoBusinesses() {
    const businessA = await createBusiness({ name: "Biz A", slug: "biz-a" });
    const businessB = await createBusiness({ name: "Biz B", slug: "biz-b" });
    await createUser({ business: businessA, email: "a@example.com", role: "owner", name: "A" });
    await createUser({ business: businessB, email: "b@example.com", role: "owner", name: "B" });
    const cookieA = await loginAs("a@example.com");
    const cookieB = await loginAs("b@example.com");
    return { businessA, businessB, cookieA, cookieB };
  }

  test("unauthenticated request gets 401 when AUTH_ENFORCEMENT=true", async () => {
    await request(app).get("/api/products").expect(401);
    await request(app).get("/api/inventory/movements").expect(401);
  });

  test("A cannot GET/PUT/DELETE B's product by id or SKU (404)", async () => {
    const { cookieA, cookieB } = await seedTwoBusinesses();
    const createRes = await createProductAs(cookieB, { sku: "SKU-B1", title: "B Product" });
    expect(createRes.status).toBe(201);
    const id = createRes.body.product._id;

    await request(app).get(`/api/products/${id}`).set("Cookie", cookieA).expect(404);
    await request(app).get(`/api/products/sku/SKU-B1`).set("Cookie", cookieA).expect(404);
    await request(app)
      .put(`/api/products/${id}`)
      .set("Cookie", cookieA)
      .send({ title: "X", sku: "SKU-B1", category: "Cat", brand: "Brand" })
      .expect(404);
    await request(app).delete(`/api/products/${id}`).set("Cookie", cookieA).expect(404);

    // B can still access it
    await request(app).get(`/api/products/${id}`).set("Cookie", cookieB).expect(200);
    await request(app).get(`/api/products/sku/SKU-B1`).set("Cookie", cookieB).expect(200);
  });

  test("lists and search return only own rows", async () => {
    const { cookieA, cookieB } = await seedTwoBusinesses();
    await createProductAs(cookieA, { sku: "SKU-A1", title: "Alpha" });
    await createProductAs(cookieB, { sku: "SKU-B1", title: "Bravo" });

    const listA = await request(app).get("/api/products").set("Cookie", cookieA);
    expect(listA.status).toBe(200);
    expect(listA.body.products).toHaveLength(1);
    expect(listA.body.products[0].sku).toBe("SKU-A1");

    const searchA = await request(app).get("/api/products?search=Bravo").set("Cookie", cookieA);
    expect(searchA.status).toBe(200);
    expect(searchA.body.products).toHaveLength(0);

    const searchB = await request(app).get("/api/products?search=Alpha").set("Cookie", cookieB);
    expect(searchB.status).toBe(200);
    expect(searchB.body.products).toHaveLength(0);
  });

  test("inventory totals and stock movements are per business", async () => {
    const { cookieA, cookieB, businessA, businessB } = await seedTwoBusinesses();
    const aRes = await createProductAs(cookieA, { sku: "SKU-A1", openingStock: 10 });
    const bRes = await createProductAs(cookieB, { sku: "SKU-B1", openingStock: 20 });
    expect(aRes.status).toBe(201);
    expect(bRes.status).toBe(201);

    const adjA = await request(app)
      .post(`/api/products/${aRes.body.product._id}/adjust-stock`)
      .set("Cookie", cookieA)
      .send({ direction: "add", quantity: 5, reason: "test" });
    expect(adjA.status).toBe(201);

    const movA = await request(app).get("/api/inventory/movements").set("Cookie", cookieA);
    const movB = await request(app).get("/api/inventory/movements").set("Cookie", cookieB);
    expect(movA.status).toBe(200);
    expect(movB.status).toBe(200);
    expect(movA.body.movements).toHaveLength(1);
    expect(movB.body.movements).toHaveLength(0);
    expect(movA.body.movements[0].businessId).toBe(String(businessA._id));

    const productsA = await request(app).get("/api/products").set("Cookie", cookieA);
    const productsB = await request(app).get("/api/products").set("Cookie", cookieB);
    expect(productsA.body.products[0].openingStock).toBe(15);
    expect(productsB.body.products[0].openingStock).toBe(20);
    expect(productsB.body.products[0].businessId).toBe(String(businessB._id));
  });

  test("duplicate SKU allowed across businesses but blocked within one", async () => {
    const { cookieA, cookieB } = await seedTwoBusinesses();
    const a1 = await createProductAs(cookieA, { sku: "SHARED-SKU", title: "A1" });
    expect(a1.status).toBe(201);

    const b1 = await createProductAs(cookieB, { sku: "SHARED-SKU", title: "B1" });
    expect(b1.status).toBe(201);

    const a2 = await createProductAs(cookieA, { sku: "SHARED-SKU", title: "A2" });
    expect(a2.status).toBe(409);
  });

  test("businessId in body is ignored on create", async () => {
    const { cookieA, businessB } = await seedTwoBusinesses();
    const res = await createProductAs(cookieA, {
      sku: "SKU-A1",
      businessId: String(businessB._id),
    });
    expect(res.status).toBe(201);
    expect(res.body.product.businessId).not.toBe(String(businessB._id));

    const stored = await Product.findById(res.body.product._id).lean();
    expect(String(stored.businessId)).not.toBe(String(businessB._id));
  });

  test("cross-business adjust-stock and movement delete return 404", async () => {
    const { cookieA, cookieB } = await seedTwoBusinesses();
    const bRes = await createProductAs(cookieB, { sku: "SKU-B1", openingStock: 10 });
    const productBId = bRes.body.product._id;

    const adj = await request(app)
      .post(`/api/products/${productBId}/adjust-stock`)
      .set("Cookie", cookieA)
      .send({ direction: "add", quantity: 1 });
    expect(adj.status).toBe(404);

    const adjB = await request(app)
      .post(`/api/products/${productBId}/adjust-stock`)
      .set("Cookie", cookieB)
      .send({ direction: "add", quantity: 1 });
    expect(adjB.status).toBe(201);
    const movementId = adjB.body.movement._id;

    await request(app).delete(`/api/inventory/movements/${movementId}`).set("Cookie", cookieA).expect(404);
    await request(app).delete(`/api/inventory/movements/${movementId}`).set("Cookie", cookieB).expect(200);
  });

  test("update cannot change businessId", async () => {
    const { cookieA, businessB } = await seedTwoBusinesses();
    const createRes = await createProductAs(cookieA, { sku: "SKU-A1", title: "A1" });
    const id = createRes.body.product._id;

    const updateRes = await request(app)
      .put(`/api/products/${id}`)
      .set("Cookie", cookieA)
      .send({
        title: "A1 Updated",
        sku: "SKU-A1",
        category: "Cat",
        brand: "Brand",
        businessId: String(businessB._id),
      });
    expect(updateRes.status).toBe(200);
    expect(String(updateRes.body.product.businessId)).not.toBe(String(businessB._id));
  });
});
