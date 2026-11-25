const request = require("supertest");
const app = require("../src/app");
const Brand = require("../src/models/Brand");
const Product = require("../src/models/Product");
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
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  expect(response.status).toBe(200);
  return cookieHeader(response);
}

async function createBrandAs(cookie, payload) {
  return request(app)
    .post("/api/brands")
    .set("Cookie", cookie)
    .send(payload);
}

function productPayload(overrides = {}) {
  return {
    title: "Test Product",
    sku: `SKU-${Math.random().toString(36).slice(2, 10)}`,
    category: "Cat",
    reorderThreshold: 5,
    ...overrides,
  };
}

describe("Brands API and product integration", () => {
  const prevAuth = process.env.AUTH_ENFORCEMENT;
  const prevTenant = process.env.TENANT_ENFORCEMENT;

  beforeAll(async () => {
    process.env.AUTH_ENFORCEMENT = "true";
    process.env.TENANT_ENFORCEMENT = "true";
    await connectTestDB();
    await clearTestDB();
    await Brand.syncIndexes();
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

  let seedSequence = 0;

  async function seedTwoBusinesses() {
    seedSequence += 1;
    const suffix = `${Date.now()}-${seedSequence}`;
    const emailA = `brand-a-${suffix}@example.com`;
    const emailB = `brand-b-${suffix}@example.com`;
    const businessA = await createBusiness({
      name: "Brand Biz A",
      slug: `brand-biz-a-${suffix}`,
    });
    const businessB = await createBusiness({
      name: "Brand Biz B",
      slug: `brand-biz-b-${suffix}`,
    });
    await createUser({ business: businessA, email: emailA, name: "Brand A" });
    await createUser({ business: businessB, email: emailB, name: "Brand B" });
    return {
      businessA,
      businessB,
      cookieA: await loginAs(emailA),
      cookieB: await loginAs(emailB),
    };
  }

  test("requires authentication", async () => {
    await request(app).get("/api/brands").expect(401);
    await request(app).post("/api/brands").send({ name: "X" }).expect(401);
  });

  test("validates and normalizes brand names, rejects duplicates per business", async () => {
    const { cookieA, cookieB, businessA, businessB } = await seedTwoBusinesses();

    const empty = await createBrandAs(cookieA, { name: "   " });
    expect(empty.status).toBe(400);

    const created = await createBrandAs(cookieA, {
      name: "  Dalda   Foods Ltd  ",
      description: "  Cooking oil brand.  ",
      businessId: String(businessB._id),
    });
    expect(created.status).toBe(201);
    expect(created.body.brand.name).toBe("Dalda Foods Ltd");
    expect(created.body.brand.normalizedName).toBe("dalda foods ltd");
    expect(created.body.brand.description).toBe("Cooking oil brand.");
    expect(String(created.body.brand.businessId)).toBe(String(businessA._id));

    const duplicate = await createBrandAs(cookieA, { name: "dalda  foods ltd" });
    expect(duplicate.status).toBe(409);

    const otherBusiness = await createBrandAs(cookieB, { name: "Dalda Foods Ltd" });
    expect(otherBusiness.status).toBe(201);
    expect(String(otherBusiness.body.brand.businessId)).toBe(String(businessB._id));
  });

  test("lists, searches, and filters brands only within the active business", async () => {
    const { cookieA, cookieB } = await seedTwoBusinesses();

    const a1 = await createBrandAs(cookieA, { name: "Alpha" });
    const a2 = await createBrandAs(cookieA, { name: "Beta", isActive: false });
    await createBrandAs(cookieB, { name: "Gamma" });

    const listA = await request(app).get("/api/brands").set("Cookie", cookieA);
    expect(listA.status).toBe(200);
    expect(listA.body.brands).toHaveLength(2);

    const searchA = await request(app)
      .get("/api/brands?search=gamma")
      .set("Cookie", cookieA);
    expect(searchA.body.brands).toHaveLength(0);

    const activeOnly = await request(app)
      .get("/api/brands?active=true")
      .set("Cookie", cookieA);
    expect(activeOnly.body.brands).toHaveLength(1);
    expect(activeOnly.body.brands[0]._id).toBe(a1.body.brand._id);

    const inactiveOnly = await request(app)
      .get("/api/brands?active=false")
      .set("Cookie", cookieA);
    expect(inactiveOnly.body.brands).toHaveLength(1);
    expect(inactiveOnly.body.brands[0]._id).toBe(a2.body.brand._id);
  });

  test("bounds type-ahead search with limit/page and treats search text literally", async () => {
    const { cookieA } = await seedTwoBusinesses();
    for (const name of ["Neo Oil", "Nestle Ghee", "Nesco", "Other Brand"]) {
      const created = await createBrandAs(cookieA, { name });
      expect(created.status).toBe(201);
    }

    const firstPage = await request(app)
      .get("/api/brands?search=ne&active=true&limit=2&page=1")
      .set("Cookie", cookieA);
    expect(firstPage.status).toBe(200);
    expect(firstPage.body.brands).toHaveLength(2);
    expect(firstPage.body.total).toBe(3);
    expect(firstPage.body.page).toBe(1);
    expect(firstPage.body.pageSize).toBe(2);
    expect(firstPage.body.hasMore).toBe(true);
    expect(
      firstPage.body.brands.every((brand) => brand.name.toLowerCase().includes("ne"))
    ).toBe(true);

    const secondPage = await request(app)
      .get("/api/brands?search=ne&active=true&limit=2&page=2")
      .set("Cookie", cookieA);
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.brands).toHaveLength(1);
    expect(secondPage.body.hasMore).toBe(false);

    const narrower = await request(app)
      .get("/api/brands?search=nes&limit=10")
      .set("Cookie", cookieA);
    expect(narrower.status).toBe(200);
    expect(narrower.body.total).toBe(2);
    expect(
      narrower.body.brands.every((brand) => brand.name.toLowerCase().includes("nes"))
    ).toBe(true);

    const literal = await request(app)
      .get("/api/brands?search=%5B&limit=10")
      .set("Cookie", cookieA);
    expect(literal.status).toBe(200);
    expect(literal.body.total).toBe(0);

    const invalidLimit = await request(app)
      .get("/api/brands?limit=101")
      .set("Cookie", cookieA);
    expect(invalidLimit.status).toBe(400);
  });

  test("hides cross-tenant brands behind 404 for get, update, and status", async () => {
    const { cookieA, cookieB } = await seedTwoBusinesses();
    const created = await createBrandAs(cookieB, { name: "Bravo" });
    const id = created.body.brand._id;

    await request(app).get(`/api/brands/${id}`).set("Cookie", cookieA).expect(404);
    await request(app)
      .put(`/api/brands/${id}`)
      .set("Cookie", cookieA)
      .send({ name: "Hijacked" })
      .expect(404);
    await request(app)
      .patch(`/api/brands/${id}/status`)
      .set("Cookie", cookieA)
      .send({ isActive: false })
      .expect(404);

    await request(app).get(`/api/brands/${id}`).set("Cookie", cookieB).expect(200);
    await request(app).get("/api/brands/not-an-id").set("Cookie", cookieA).expect(400);
  });

  test("gets and updates brands with normalization, duplicate checks, and payload validation", async () => {
    const { cookieA } = await seedTwoBusinesses();
    const first = await createBrandAs(cookieA, { name: "First Brand", description: "Original" });
    const second = await createBrandAs(cookieA, { name: "Second Brand" });
    const id = first.body.brand._id;

    const fetched = await request(app).get(`/api/brands/${id}`).set("Cookie", cookieA);
    expect(fetched.status).toBe(200);
    expect(fetched.body.brand.name).toBe("First Brand");

    const updated = await request(app)
      .put(`/api/brands/${id}`)
      .set("Cookie", cookieA)
      .send({ name: "  Updated   Brand ", description: "  New note  ", isActive: false });
    expect(updated.status).toBe(200);
    expect(updated.body.brand.name).toBe("Updated Brand");
    expect(updated.body.brand.normalizedName).toBe("updated brand");
    expect(updated.body.brand.description).toBe("New note");
    expect(updated.body.brand.isActive).toBe(false);

    const duplicate = await request(app)
      .put(`/api/brands/${id}`)
      .set("Cookie", cookieA)
      .send({ name: second.body.brand.name });
    expect(duplicate.status).toBe(409);

    expect((await createBrandAs(cookieA, { name: "   " })).status).toBe(400);
    expect((await createBrandAs(cookieA, { name: "x".repeat(121) })).status).toBe(400);
    expect(
      (await createBrandAs(cookieA, { name: "Long Desc", description: "x".repeat(501) })).status
    ).toBe(400);

    const invalidStatus = await request(app)
      .patch(`/api/brands/${id}/status`)
      .set("Cookie", cookieA)
      .send({ isActive: "maybe" });
    expect(invalidStatus.status).toBe(400);
  });

  test("product updates preserve, clear, and keep legacy brand values", async () => {
    const { cookieA } = await seedTwoBusinesses();
    const brand = await createBrandAs(cookieA, { name: "Preserved Brand" });
    const brandId = brand.body.brand._id;

    const created = await request(app)
      .post("/api/products")
      .set("Cookie", cookieA)
      .send(productPayload({ brandId }));
    expect(created.status).toBe(201);
    const productId = created.body.product._id;

    const omitted = await request(app)
      .put(`/api/products/${productId}`)
      .set("Cookie", cookieA)
      .send({
        title: "Renamed Product",
        sku: created.body.product.sku,
        category: "Cat",
        reorderThreshold: 5,
      });
    expect(omitted.status).toBe(200);
    expect(String(omitted.body.product.brandId)).toBe(brandId);
    expect(omitted.body.product.brand).toBe("Preserved Brand");

    const cleared = await request(app)
      .put(`/api/products/${productId}`)
      .set("Cookie", cookieA)
      .send({
        title: "Renamed Product",
        sku: created.body.product.sku,
        category: "Cat",
        reorderThreshold: 5,
        brandId: "",
        brand: "",
      });
    expect(cleared.status).toBe(200);
    expect(cleared.body.product.brandId || null).toBeNull();
    expect(cleared.body.product.brand).toBe("");

    const legacy = await request(app)
      .post("/api/products")
      .set("Cookie", cookieA)
      .send(productPayload({ brand: "  Old   Free Text  " }));
    expect(legacy.status).toBe(201);
    expect(legacy.body.product.brand).toBe("Old Free Text");
    expect(legacy.body.product.brandId || null).toBeNull();
  });

  test("reports product count and does not mutate relationships on deactivation", async () => {
    const { cookieA } = await seedTwoBusinesses();
    const brand = await createBrandAs(cookieA, { name: "Activated Brand" });
    const brandId = brand.body.brand._id;

    const product = await request(app)
      .post("/api/products")
      .set("Cookie", cookieA)
      .send(productPayload({ brandId }));
    expect(product.status).toBe(201);
    expect(product.body.product.brand).toBe("Activated Brand");
    expect(String(product.body.product.brandId)).toBe(brandId);

    const status = await request(app)
      .patch(`/api/brands/${brandId}/status`)
      .set("Cookie", cookieA)
      .send({ isActive: false });
    expect(status.status).toBe(200);
    expect(status.body.brand.isActive).toBe(false);
    expect(status.body.brand.productCount).toBe(1);

    const unchanged = await request(app)
      .get(`/api/products/${product.body.product._id}`)
      .set("Cookie", cookieA);
    expect(String(unchanged.body.product.brandId)).toBe(brandId);
  });

  test("product create rejects invalid, inactive, and cross-tenant brands", async () => {
    const { cookieA, cookieB } = await seedTwoBusinesses();
    const inactive = await createBrandAs(cookieA, { name: "Hidden", isActive: false });
    const other = await createBrandAs(cookieB, { name: "Other Biz Brand" });

    for (const brandId of [
      "not-an-object-id",
      inactive.body.brand._id,
      other.body.brand._id,
    ]) {
      const response = await request(app)
        .post("/api/products")
        .set("Cookie", cookieA)
        .send(productPayload({ brandId }));
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Selected brand is invalid or inactive");
    }

    const withoutBrand = await request(app)
      .post("/api/products")
      .set("Cookie", cookieA)
      .send(productPayload());
    expect(withoutBrand.status).toBe(201);
    expect(withoutBrand.body.product.brandId || null).toBeNull();
  });

  test("product edit preserves an already assigned inactive brand but rejects a new one", async () => {
    const { cookieA } = await seedTwoBusinesses();
    const brand = await createBrandAs(cookieA, { name: "Legacy Active Brand" });
    const inactive = await createBrandAs(cookieA, { name: "New Inactive Brand", isActive: false });
    const brandId = brand.body.brand._id;

    const product = await request(app)
      .post("/api/products")
      .set("Cookie", cookieA)
      .send(productPayload({ brandId }));
    expect(product.status).toBe(201);

    const rejected = await request(app)
      .put(`/api/products/${product.body.product._id}`)
      .set("Cookie", cookieA)
      .send({
        title: "Updated Product",
        sku: product.body.product.sku,
        category: "Cat",
        reorderThreshold: 5,
        brandId: inactive.body.brand._id,
      });
    expect(rejected.status).toBe(400);

    await request(app)
      .patch(`/api/brands/${brandId}/status`)
      .set("Cookie", cookieA)
      .send({ isActive: false })
      .expect(200);

    const preserved = await request(app)
      .put(`/api/products/${product.body.product._id}`)
      .set("Cookie", cookieA)
      .send({
        title: "Updated Product",
        sku: product.body.product.sku,
        category: "Cat",
        reorderThreshold: 5,
        brandId,
      });
    expect(preserved.status).toBe(200);
    expect(String(preserved.body.product.brandId)).toBe(brandId);
    expect(preserved.body.product.brand).toBe("Legacy Active Brand");
  });
});
