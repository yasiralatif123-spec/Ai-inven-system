const mongoose = require("mongoose");
const { runMigration } = require("../scripts/migrate-auth-tenancy");
const Business = require("../src/models/Business");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Supplier = require("../src/models/Supplier");
const Customer = require("../src/models/Customer");
const Purchase = require("../src/models/Purchase");
const SaleOrder = require("../src/models/SaleOrder");
const StockMovement = require("../src/models/StockMovement");
const { createBusiness, createUser } = require("./helpers/auth");
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

const testUri = process.env.MONGODB_TEST_URI;

async function seedLegacyData(business) {
  const product = await Product.create({
    title: "Legacy Product",
    sku: "LEG-SKU-1",
    category: "Cat",
    brand: "Brand",
    businessId: null,
  });
  const supplier = await Supplier.create({
    supplierCode: "S-1",
    name: "Legacy Supplier",
    contactPerson: "Contact",
    phone: "123",
    address: "Addr",
    paymentTerms: "net-30",
    businessId: null,
  });
  const customer = await Customer.create({
    ledgerCode: "C-1",
    name: "Legacy Customer",
    businessName: "Biz",
    phone: "123",
    city: "City",
    address: "Addr",
    customerType: "Wholesale",
    status: "Active",
    creditLimit: 0,
    paymentTerms: "cod",
    businessId: null,
  });
  const purchase = await Purchase.create({
    purchaseNumber: "PO-1",
    supplier: { name: supplier.name },
    purchaseDate: new Date(),
    expectedDelivery: new Date(),
    items: [{ name: "Item", quantity: 1, unitPrice: 10, lineTotal: 10 }],
    financials: { subtotal: 10, discount: 0, tax: 0, freight: 0, total: 10 },
    businessId: null,
  });
  const saleOrder = await SaleOrder.create({
    orderNumber: "SO-1",
    customer: { name: customer.name },
    items: [],
    financials: { subtotal: 10, discount: 0, tax: 0, freight: 0, total: 10, paid: 0, outstanding: 10 },
    businessId: null,
  });
  const stockMovement = await StockMovement.create({
    product: product._id,
    sku: "LEG-SKU-1",
    productTitle: "Legacy Product",
    direction: "in",
    quantity: 1,
    previousStock: 0,
    newStock: 1,
    businessId: null,
  });

  // Legacy staff role inserted bypassing Mongoose enum validation.
  await User.collection.insertOne({
    name: "Legacy Staff",
    email: "staff@example.com",
    password: "hashed",
    role: "staff",
    businessId: business._id,
    emailVerified: true,
    tokenVersion: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { product, supplier, customer, purchase, saleOrder, stockMovement };
}

describe("migrate:auth-tenancy", () => {
  test("refuses to run a real migration without --confirm", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "owner@example.com", role: "owner" });

    await expect(
      runMigration({ dryRun: false, confirm: false, uri: testUri })
    ).rejects.toThrow(/--confirm/);
  });

  test("dry-run changes nothing", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "owner@example.com", role: "owner" });
    await seedLegacyData(business);

    const before = {
      products: await Product.countDocuments({ businessId: null }),
      suppliers: await Supplier.countDocuments({ businessId: null }),
      customers: await Customer.countDocuments({ businessId: null }),
      purchases: await Purchase.countDocuments({ businessId: null }),
      saleorders: await SaleOrder.countDocuments({ businessId: null }),
      stockmovements: await StockMovement.countDocuments({ businessId: null }),
      staff: await User.countDocuments({ role: "staff" }),
    };

    const result = await runMigration({ dryRun: true, confirm: false, uri: testUri });
    expect(result.dryRun).toBe(true);

    expect(await Product.countDocuments({ businessId: null })).toBe(before.products);
    expect(await Supplier.countDocuments({ businessId: null })).toBe(before.suppliers);
    expect(await Customer.countDocuments({ businessId: null })).toBe(before.customers);
    expect(await Purchase.countDocuments({ businessId: null })).toBe(before.purchases);
    expect(await SaleOrder.countDocuments({ businessId: null })).toBe(before.saleorders);
    expect(await StockMovement.countDocuments({ businessId: null })).toBe(before.stockmovements);
    expect(await User.countDocuments({ role: "staff" })).toBe(before.staff);
  });

  test("real run backfills missing businessId and maps staff role", async () => {
    const business = await createBusiness();
    const owner = await createUser({ business, email: "owner@example.com", role: "owner" });
    await seedLegacyData(business);

    const result = await runMigration({ dryRun: false, confirm: true, uri: testUri });
    expect(result.dryRun).toBe(false);
    expect(result.business.id).toBe(String(business._id));

    expect(await Product.countDocuments({ businessId: business._id })).toBe(1);
    expect(await Supplier.countDocuments({ businessId: business._id })).toBe(1);
    expect(await Customer.countDocuments({ businessId: business._id })).toBe(1);
    expect(await Purchase.countDocuments({ businessId: business._id })).toBe(1);
    expect(await SaleOrder.countDocuments({ businessId: business._id })).toBe(1);
    expect(await StockMovement.countDocuments({ businessId: business._id })).toBe(1);

    expect(await User.countDocuments({ role: "staff" })).toBe(0);
    const mapped = await User.findOne({ email: "staff@example.com" });
    expect(mapped.role).toBe("user");

    const ownerAfter = await User.findById(owner._id);
    expect(ownerAfter.role).toBe("owner");
  });

  test("second run is idempotent", async () => {
    const business = await createBusiness();
    await createUser({ business, email: "owner@example.com", role: "owner" });
    await seedLegacyData(business);

    const first = await runMigration({ dryRun: false, confirm: true, uri: testUri });
    const second = await runMigration({ dryRun: false, confirm: true, uri: testUri });

    expect(first.changes.products.modified).toBe(1);
    expect(second.changes.products.modified).toBe(0);
    expect(second.changes.suppliers.modified).toBe(0);
    expect(second.changes.customers.modified).toBe(0);
    expect(second.changes.purchases.modified).toBe(0);
    expect(second.changes.saleorders.modified).toBe(0);
    expect(second.changes.stockmovements.modified).toBe(0);
    expect(second.changes.users.staffModified).toBe(0);
  });

  test("fails clearly when no owner exists", async () => {
    await expect(
      runMigration({ dryRun: true, confirm: false, uri: testUri })
    ).rejects.toThrow(/No owner user found/);
  });

  test("fails clearly when multiple owners exist without --business-id", async () => {
    const businessA = await createBusiness({ name: "A", slug: "a" });
    const businessB = await createBusiness({ name: "B", slug: "b" });
    await createUser({ business: businessA, email: "a@example.com", role: "owner", name: "A" });
    await createUser({ business: businessB, email: "b@example.com", role: "owner", name: "B" });

    await expect(
      runMigration({ dryRun: true, confirm: false, uri: testUri })
    ).rejects.toThrow(/More than one owner exists/);

    const result = await runMigration({
      dryRun: true,
      confirm: false,
      uri: testUri,
      businessId: String(businessA._id),
    });
    expect(result.business.id).toBe(String(businessA._id));
  });
});
