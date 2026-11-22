const mongoose = require("mongoose");
const Product = require("../src/models/Product");
const { createBusiness } = require("./helpers/auth");
const { tenantFilter, findOwned, assertOwned } = require("../src/utils/tenant");
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
} = require("./helpers/test-db");

beforeAll(async () => {
  await connectTestDB();
});
afterEach(async () => {
  await clearTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});

function reqForBusiness(businessId) {
  return { auth: { businessId: String(businessId) }, user: { businessId: String(businessId) } };
}

describe("tenant helpers", () => {
  test("tenantFilter scopes by businessId and merges extra filters", async () => {
    const business = await createBusiness({ name: "Biz A" });
    const filter = tenantFilter(reqForBusiness(business._id), { status: "active" });
    expect(filter).toMatchObject({
      businessId: String(business._id),
      status: "active",
    });
  });

  test("tenantFilter throws 404 when business context is missing", () => {
    expect(() => tenantFilter({ user: {} })).toThrow();
    try {
      tenantFilter({ user: {} });
    } catch (error) {
      expect(error.statusCode).toBe(404);
    }
  });

  test("findOwned returns null for cross-business ID and assertOwned throws 404", async () => {
    const businessA = await createBusiness({ name: "Biz A", slug: "biz-a" });
    const businessB = await createBusiness({ name: "Biz B", slug: "biz-b" });
    const product = await Product.create({
      title: "Test Product",
      sku: "SKU-1",
      category: "Cat",
      brand: "Brand",
      businessId: businessA._id,
    });

    const found = await findOwned(Product, product._id, reqForBusiness(businessB._id));
    expect(found).toBeNull();

    await expect(assertOwned(Product, product._id, reqForBusiness(businessB._id))).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test("findOwned/assertOwned return doc for same-business ID", async () => {
    const business = await createBusiness({ name: "Biz A", slug: "biz-a" });
    const product = await Product.create({
      title: "Test Product",
      sku: "SKU-1",
      category: "Cat",
      brand: "Brand",
      businessId: business._id,
    });

    const found = await findOwned(Product, product._id, reqForBusiness(business._id));
    expect(found).toBeTruthy();
    expect(String(found._id)).toBe(String(product._id));

    const asserted = await assertOwned(Product, product._id, reqForBusiness(business._id));
    expect(String(asserted._id)).toBe(String(product._id));
  });

  test("invalid or cross-tenant id never returns 403", async () => {
    const businessA = await createBusiness({ name: "Biz A", slug: "biz-a" });
    const businessB = await createBusiness({ name: "Biz B", slug: "biz-b" });
    const product = await Product.create({
      title: "Test Product",
      sku: "SKU-1",
      category: "Cat",
      brand: "Brand",
      businessId: businessA._id,
    });

    await expect(assertOwned(Product, "not-an-id", reqForBusiness(businessA._id))).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(assertOwned(Product, product._id, reqForBusiness(businessB._id))).rejects.toMatchObject({
      statusCode: 404,
    });

    const missing = await findOwned(Product, new mongoose.Types.ObjectId(), reqForBusiness(businessA._id));
    expect(missing).toBeNull();
  });
});
