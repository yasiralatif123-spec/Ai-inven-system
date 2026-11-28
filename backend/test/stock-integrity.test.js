const request = require("supertest");
const app = require("../src/app");
const Product = require("../src/models/Product");
const Supplier = require("../src/models/Supplier");
const SaleOrder = require("../src/models/SaleOrder");
const Purchase = require("../src/models/Purchase");
const StockMovement = require("../src/models/StockMovement");
const { connectTestDB, clearTestDB, disconnectTestDB } = require("./helpers/test-db");
const { seedCustomer } = require("./helpers/customers");

let defaultCustomer = null;

function randomSku(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

async function seedProduct({
  openingStock = 100,
  purchasePrice = 10,
  wholesalePrice = 20,
  uom = "Piece",
  overrides = {},
} = {}) {
  return Product.create({
    title: "Stock Widget",
    sku: randomSku("STOCK"),
    category: "Test",
    brand: "Test Brand",
    reorderThreshold: 5,
    priceUnit: "Piece",
    uom,
    purchasePrice,
    wholesalePrice,
    retailPrice: wholesalePrice + 10,
    openingStock,
    ...overrides,
  });
}

function productApiPayload(overrides = {}) {
  return {
    title: "Stock Widget",
    sku: randomSku("API"),
    category: "Test",
    brand: "Test Brand",
    reorderThreshold: 5,
    priceUnit: "Piece",
    uom: "Piece",
    purchasePrice: 10,
    wholesalePrice: 20,
    retailPrice: 30,
    ...overrides,
  };
}

async function seedSupplier() {
  return Supplier.create({
    supplierCode: randomSku("SUP"),
    name: "Test Supplier",
    contactPerson: "Test Contact",
    phone: "+92 3001234567",
    address: "Test Address",
    paymentTerms: "net-15",
  });
}

function salePayload(product, quantity, overrides = {}) {
  return {
    customerId: String(defaultCustomer._id),
    customer: defaultCustomer.name,
    phone: defaultCustomer.phone,
    paymentStatus: "unpaid",
    paymentMethod: "Cash",
    status: "Pending Approval",
    items: [
      {
        name: product.title,
        sku: product.sku,
        productId: String(product._id),
        quantity,
        unitLabel: "Piece",
        unitPrice: product.wholesalePrice,
      },
    ],
    discount: 0,
    freight: 0,
    ...overrides,
  };
}

function purchasePayload(supplier, product, quantity, overrides = {}) {
  return {
    supplierId: String(supplier._id),
    purchaseDate: "2026-01-01",
    expectedDelivery: "2026-01-05",
    invoiceNumber: "INV-PHASE3",
    status: "Draft",
    freight: 0,
    items: [
      {
        name: product.title,
        sku: product.sku,
        productId: String(product._id),
        quantity,
        unit: "Piece",
        unitPrice: product.purchasePrice,
        discount: 0,
        taxRate: 0,
      },
    ],
    ...overrides,
  };
}

async function stockOf(productId) {
  const product = await Product.findById(productId).lean();
  return Number(product?.openingStock || 0);
}

async function movementsFor(productId, extra = {}) {
  return StockMovement.find({ product: productId, ...extra }).lean();
}

async function moveCount(productId, direction, reasonPattern) {
  return movementsFor(productId, {
    direction,
    ...(reasonPattern ? { reason: reasonPattern } : {}),
  });
}

describe("Phase 3 - stock integrity and immutable movements", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  beforeEach(async () => {
    defaultCustomer = await seedCustomer();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  test("product create stores movement count for opening stock", async () => {
    const response = await request(app)
      .post("/api/products")
      .send(productApiPayload({ openingStock: 12 }));

    expect(response.status).toBe(201);
    const id = response.body.product._id;
    expect(await stockOf(id)).toBe(12);
    const movements = await movementsFor(id);
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({
      type: "adjustment",
      direction: "in",
      quantity: 12,
      baseQuantity: 12,
      previousStock: 0,
      newStock: 12,
      reason: "Opening stock on product creation",
    });
  });

  test("product create rejects negative, decimal, NaN, Infinity, and malformed stock", async () => {
    const invalid = [-1, 2.5, "NaN", "Infinity", "12abc", {}, "9007199254740992"];
    for (const openingStock of invalid) {
      const response = await request(app)
        .post("/api/products")
        .send(productApiPayload({ openingStock }));
      expect(response.status).toBe(400);
    }
    expect(await Product.countDocuments({})).toBe(0);
    expect(await StockMovement.countDocuments({})).toBe(0);
  });

  test("product create accepts a whole-number string as base pieces", async () => {
    const response = await request(app)
      .post("/api/products")
      .send(productApiPayload({ openingStock: "15" }));
    expect(response.status).toBe(201);
    expect(await stockOf(response.body.product._id)).toBe(15);
    expect(await movementsFor(response.body.product._id)).toHaveLength(1);
  });

  test("product edit increase records an adjustment movement", async () => {
    const created = await request(app)
      .post("/api/products")
      .send(productApiPayload({ openingStock: 10 }));
    const id = created.body.product._id;

    const updated = await request(app)
      .put(`/api/products/${id}`)
      .send(productApiPayload({ sku: created.body.product.sku, openingStock: 18 }));

    expect(updated.status).toBe(200);
    expect(await stockOf(id)).toBe(18);
    const increases = await moveCount(id, "in", /increased by product edit/);
    expect(increases).toHaveLength(1);
    expect(increases[0]).toMatchObject({ quantity: 8, previousStock: 10, newStock: 18 });
  });

  test("product edit decrease records an adjustment movement", async () => {
    const created = await request(app)
      .post("/api/products")
      .send(productApiPayload({ openingStock: 20 }));
    const id = created.body.product._id;

    const updated = await request(app)
      .put(`/api/products/${id}`)
      .send(productApiPayload({ sku: created.body.product.sku, openingStock: 7 }));

    expect(updated.status).toBe(200);
    expect(await stockOf(id)).toBe(7);
    const decreases = await moveCount(id, "out", /reduced by product edit/);
    expect(decreases).toHaveLength(1);
    expect(decreases[0]).toMatchObject({ quantity: 13, previousStock: 20, newStock: 7 });
  });

  test("product edit rejects invalid stock without changing stock or history", async () => {
    const created = await request(app)
      .post("/api/products")
      .send(productApiPayload({ openingStock: 10 }));
    const id = created.body.product._id;
    const before = await movementsFor(id);

    const updated = await request(app)
      .put(`/api/products/${id}`)
      .send(productApiPayload({ sku: created.body.product.sku, openingStock: "3.5" }));

    expect(updated.status).toBe(400);
    expect(await stockOf(id)).toBe(10);
    expect(await movementsFor(id)).toHaveLength(before.length);
  });

  test("product deletion writes off remaining stock", async () => {
    const created = await request(app)
      .post("/api/products")
      .send(productApiPayload({ openingStock: 9 }));
    const id = created.body.product._id;

    const deleted = await request(app).delete(`/api/products/${id}`);
    expect(deleted.status).toBe(200);
    expect(await Product.findById(id)).toBeNull();
    const writeoffs = await StockMovement.find({
      product: id,
      type: "writeoff",
      direction: "out",
    }).lean();
    expect(writeoffs).toHaveLength(1);
    expect(writeoffs[0]).toMatchObject({ quantity: 9, previousStock: 9, newStock: 0 });
  });

  test("product deletion with zero stock creates no write-off movement", async () => {
    const created = await request(app)
      .post("/api/products")
      .send(productApiPayload({ openingStock: 0 }));
    const id = created.body.product._id;

    expect((await request(app).delete(`/api/products/${id}`)).status).toBe(200);
    expect(await StockMovement.countDocuments({ product: id })).toBe(0);
  });

  test("manual add of one Box stores 12 base pieces and one movement", async () => {
    const product = await seedProduct({ openingStock: 0 });
    const response = await request(app)
      .post(`/api/products/${product._id}/adjust-stock`)
      .send({ direction: "add", quantity: 1, unit: "Box", reason: "test receipt" });

    expect(response.status).toBe(201);
    expect(await stockOf(product._id)).toBe(12);
    const movements = await movementsFor(product._id);
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({
      quantity: 12,
      baseQuantity: 12,
      originalQuantity: 1,
      originalUnit: "Box",
      newStock: 12,
    });
  });

  test("manual adjustment rejects decimal and malformed quantities", async () => {
    const product = await seedProduct({ openingStock: 10 });
    for (const quantity of [1.5, "-2", "NaN", "Infinity", "abc", ""]) {
      const response = await request(app)
        .post(`/api/products/${product._id}/adjust-stock`)
        .send({ direction: "add", quantity });
      expect(response.status).toBe(400);
    }
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id)).toHaveLength(0);
  });

  test("manual deduction is guarded and never creates a movement on failure", async () => {
    const product = await seedProduct({ openingStock: 5 });
    const response = await request(app)
      .post(`/api/products/${product._id}/adjust-stock`)
      .send({ direction: "deduct", quantity: 6, unit: "Piece" });

    expect(response.status).toBe(400);
    expect(await stockOf(product._id)).toBe(5);
    expect(await movementsFor(product._id)).toHaveLength(0);
  });

  test("reversing an adjustment retains the original and appends a compensating movement", async () => {
    const product = await seedProduct({ openingStock: 10 });
    const adjust = await request(app)
      .post(`/api/products/${product._id}/adjust-stock`)
      .send({ direction: "add", quantity: 5, unit: "Piece" });
    const originalId = adjust.body.movement._id;

    const reversed = await request(app).delete(`/api/inventory/movements/${originalId}`);
    expect(reversed.status).toBe(200);
    expect(await stockOf(product._id)).toBe(10);
    expect(await StockMovement.findById(originalId).lean()).not.toBeNull();
    const compensating = await StockMovement.find({ reversesMovement: originalId }).lean();
    expect(compensating).toHaveLength(1);
    expect(compensating[0]).toMatchObject({
      type: "adjustment",
      direction: "out",
      quantity: 5,
      previousStock: 15,
      newStock: 10,
    });
  });

  test("repeated movement reversal is idempotent", async () => {
    const product = await seedProduct({ openingStock: 10 });
    const adjust = await request(app)
      .post(`/api/products/${product._id}/adjust-stock`)
      .send({ direction: "add", quantity: 5 });
    const originalId = adjust.body.movement._id;

    await request(app).delete(`/api/inventory/movements/${originalId}`).expect(200);
    const repeat = await request(app).delete(`/api/inventory/movements/${originalId}`);
    expect(repeat.status).toBe(200);
    expect(await stockOf(product._id)).toBe(10);
    expect(await StockMovement.countDocuments({ reversesMovement: originalId })).toBe(1);
  });

  test("movement reversal refuses to drive stock negative", async () => {
    const product = await seedProduct({ openingStock: 0 });
    const add = await request(app)
      .post(`/api/products/${product._id}/adjust-stock`)
      .send({ direction: "add", quantity: 5 });
    await request(app)
      .post(`/api/products/${product._id}/adjust-stock`)
      .send({ direction: "deduct", quantity: 5 });

    const response = await request(app).delete(`/api/inventory/movements/${add.body.movement._id}`);
    expect(response.status).toBe(400);
    expect(await stockOf(product._id)).toBe(0);
    expect(await StockMovement.countDocuments({ product: product._id })).toBe(2);
  });

  test("legacy fractional movement reversal returns 400 without mutating stock", async () => {
    const product = await seedProduct({ openingStock: 10 });
    const { insertedId } = await StockMovement.collection.insertOne({
      product: product._id,
      sku: product.sku,
      productTitle: product.title,
      type: "adjustment",
      direction: "in",
      quantity: 0.5,
      originalQuantity: 0.5,
      originalUnit: "Piece",
      baseQuantity: 0.5,
      previousStock: 9.5,
      newStock: 10,
      unit: "Piece",
      reason: "Legacy fractional adjustment",
      reference: "LEGACY-FRACTION",
      notes: "",
      performedBy: "Test",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app).delete(`/api/inventory/movements/${insertedId}`);
    expect(response.status).toBe(400);
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id)).toHaveLength(1);
  });

  test("sale create deducts base pieces and writes a sale movement", async () => {
    const product = await seedProduct({ openingStock: 10 });
    const response = await request(app).post("/api/sale-orders").send(salePayload(product, 3));

    expect(response.status).toBe(201);
    expect(await stockOf(product._id)).toBe(7);
    const movements = await movementsFor(product._id, { type: "sale", direction: "out" });
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ quantity: 3, previousStock: 10, newStock: 7 });
  });

  test("sale rejects decimal negative and malformed quantities", async () => {
    const product = await seedProduct({ openingStock: 25 });
    for (const quantity of [1.5, -1, "NaN", "Infinity", "2abc", null]) {
      const response = await request(app)
        .post("/api/sale-orders")
        .send(salePayload(product, quantity));
      expect(response.status).toBe(400);
    }
    expect(await stockOf(product._id)).toBe(25);
    expect(await movementsFor(product._id)).toHaveLength(0);
  });

  test("sale overstock is rejected without stock or movement change", async () => {
    const product = await seedProduct({ openingStock: 2 });
    const response = await request(app).post("/api/sale-orders").send(salePayload(product, 3));

    expect(response.status).toBe(400);
    expect(await stockOf(product._id)).toBe(2);
    expect(await movementsFor(product._id)).toHaveLength(0);
  });

  test("concurrent sales cannot oversell stock", async () => {
    const product = await seedProduct({ openingStock: 10 });
    const results = await Promise.all([
      request(app).post("/api/sale-orders").send(salePayload(product, 6)),
      request(app).post("/api/sale-orders").send(salePayload(product, 6)),
    ]);

    expect(results.filter((result) => result.status === 201)).toHaveLength(1);
    expect(results.filter((result) => result.status === 400)).toHaveLength(1);
    expect(await stockOf(product._id)).toBe(4);
    expect(await movementsFor(product._id, { type: "sale", direction: "out" })).toHaveLength(1);
  });

  test("sale quantity increase writes only the base-piece delta", async () => {
    const product = await seedProduct({ openingStock: 20 });
    const created = await request(app).post("/api/sale-orders").send(salePayload(product, 2));
    const order = created.body.order;

    const updated = await request(app)
      .put(`/api/sale-orders/${order._id}`)
      .send(salePayload(product, 5));

    expect(updated.status).toBe(200);
    expect(await stockOf(product._id)).toBe(15);
    const movements = await movementsFor(product._id, { type: "sale", direction: "out" });
    expect(movements).toHaveLength(2);
    expect(movements[1]).toMatchObject({ quantity: 3, previousStock: 18, newStock: 15 });
  });

  test("sale quantity decrease restores only the base-piece delta", async () => {
    const product = await seedProduct({ openingStock: 20 });
    const created = await request(app).post("/api/sale-orders").send(salePayload(product, 5));

    const updated = await request(app)
      .put(`/api/sale-orders/${created.body.order._id}`)
      .send(salePayload(product, 2));

    expect(updated.status).toBe(200);
    expect(await stockOf(product._id)).toBe(18);
    const restores = await movementsFor(product._id, { type: "sale", direction: "in" });
    expect(restores).toHaveLength(1);
    expect(restores[0]).toMatchObject({ quantity: 3, previousStock: 15, newStock: 18 });
  });

  test("cancelling a sale restores stock once and clears stockDeducted", async () => {
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app).post("/api/sale-orders").send(salePayload(product, 4));

    const cancelled = await request(app)
      .patch(`/api/sale-orders/${created.body.order._id}/status`)
      .send({ status: "Cancelled" });

    expect(cancelled.status).toBe(200);
    expect(cancelled.body.order.items[0].stockDeducted).toBe(false);
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id, { type: "sale", direction: "in" })).toHaveLength(1);
  });

  test("concurrent sale cancellation restores stock only once", async () => {
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app).post("/api/sale-orders").send(salePayload(product, 4));
    const url = `/api/sale-orders/${created.body.order._id}/status`;

    const results = await Promise.all([
      request(app).patch(url).send({ status: "Cancelled" }),
      request(app).patch(url).send({ status: "Cancelled" }),
    ]);

    expect(results.every((result) => result.status === 200)).toBe(true);
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id, { type: "sale", direction: "in" })).toHaveLength(1);
  });

  test("cancelling a delivered sale does not restock", async () => {
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/sale-orders")
      .send(salePayload(product, 4, { status: "Delivered" }));

    const cancelled = await request(app)
      .patch(`/api/sale-orders/${created.body.order._id}/status`)
      .send({ status: "Cancelled" });

    expect(cancelled.status).toBe(200);
    expect(await stockOf(product._id)).toBe(6);
    expect(await movementsFor(product._id, { type: "sale", direction: "in" })).toHaveLength(0);
  });

  test("deleting a cancelled sale does not restore stock twice", async () => {
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app).post("/api/sale-orders").send(salePayload(product, 4));
    const url = `/api/sale-orders/${created.body.order._id}`;

    await request(app).patch(`${url}/status`).send({ status: "Cancelled" }).expect(200);
    expect((await request(app).delete(url)).status).toBe(200);
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id, { type: "sale", direction: "in" })).toHaveLength(1);
  });

  test("deleting an active sale restores stock once", async () => {
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app).post("/api/sale-orders").send(salePayload(product, 4));

    expect((await request(app).delete(`/api/sale-orders/${created.body.order._id}`)).status).toBe(200);
    expect(await stockOf(product._id)).toBe(10);
    const restores = await movementsFor(product._id, { type: "sale", direction: "in" });
    expect(restores).toHaveLength(1);
    expect(restores[0].reason).toBe("Sale order deleted");
  });

  test("plain sale status update preserves recorded payment fields", async () => {
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app).post("/api/sale-orders").send(salePayload(product, 4));
    const id = created.body.order._id;

    const paid = await request(app)
      .post(`/api/sale-orders/${id}/payment`)
      .set("Idempotency-Key", "phase3-sale-payment")
      .send({ amount: 5, method: "Cash" });
    expect(paid.status).toBe(200);

    const statusChange = await request(app)
      .patch(`/api/sale-orders/${id}/status`)
      .send({ status: "Processing" });
    expect(statusChange.status).toBe(200);

    const saved = await SaleOrder.findById(id).lean();
    expect(saved.payments).toHaveLength(1);
    expect(saved.financials.paid).toBe(5);
    expect(await stockOf(product._id)).toBe(6);
  });

  test("received purchase adds stock and one purchase movement", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const response = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 3, { status: "Received" }));

    expect(response.status).toBe(201);
    expect(await stockOf(product._id)).toBe(13);
    const movements = await movementsFor(product._id, { type: "purchase", direction: "in" });
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ quantity: 3, previousStock: 10, newStock: 13 });
  });

  test("draft purchase does not add stock or movements", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const response = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 3, { status: "Draft" }));

    expect(response.status).toBe(201);
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id)).toHaveLength(0);
  });

  test("purchase rejects decimal negative and malformed quantities", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    for (const quantity of [2.5, -1, "NaN", "Infinity", "3abc", null]) {
      const response = await request(app)
        .post("/api/purchases")
        .send(purchasePayload(supplier, product, quantity, { status: "Received" }));
      expect(response.status).toBe(400);
    }
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id)).toHaveLength(0);
  });

  test("receive goods rejects fractional receivedQuantity", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 2));
    const id = created.body.purchase._id;

    const response = await request(app)
      .post(`/api/purchases/${id}/receive`)
      .send({ items: [{ itemId: created.body.purchase.items[0]._id, receivedQuantity: 1.5 }] });

    expect(response.status).toBe(400);
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id)).toHaveLength(0);
  });

  test("repeated receive of the same quantity is idempotent", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 2));
    const id = created.body.purchase._id;
    const itemId = created.body.purchase.items[0]._id;
    const body = { items: [{ itemId, receivedQuantity: 2 }] };

    expect((await request(app).post(`/api/purchases/${id}/receive`).send(body)).status).toBe(200);
    expect((await request(app).post(`/api/purchases/${id}/receive`).send(body)).status).toBe(200);
    expect(await stockOf(product._id)).toBe(12);
    expect(await movementsFor(product._id, { type: "purchase", direction: "in" })).toHaveLength(1);
  });

  test("concurrent duplicate receive adds stock only once", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 2));
    const id = created.body.purchase._id;
    const itemId = created.body.purchase.items[0]._id;
    const body = { items: [{ itemId, receivedQuantity: 2 }] };

    const results = await Promise.all([
      request(app).post(`/api/purchases/${id}/receive`).send(body),
      request(app).post(`/api/purchases/${id}/receive`).send(body),
    ]);

    expect(results.some((result) => result.status === 200)).toBe(true);
    expect(await stockOf(product._id)).toBe(12);
    expect(await movementsFor(product._id, { type: "purchase", direction: "in" })).toHaveLength(1);
  });

  test("purchase unit cannot change after goods are received", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 1, { status: "Received" }));
    const id = created.body.purchase._id;
    const payload = purchasePayload(supplier, product, 1, { status: "Received" });
    payload.items[0].unit = "Box";

    const updated = await request(app).put(`/api/purchases/${id}`).send(payload);
    expect(updated.status).toBe(400);
    expect(await stockOf(product._id)).toBe(11);
    expect(await movementsFor(product._id, { type: "purchase" })).toHaveLength(1);
  });

  test("cancelling a purchase reverses stock once and clears received counters", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 3, { status: "Received" }));
    const id = created.body.purchase._id;

    const cancelled = await request(app)
      .patch(`/api/purchases/${id}/status`)
      .send({ status: "Cancelled" });

    expect(cancelled.status).toBe(200);
    expect(cancelled.body.purchase.items[0].receivedQuantity).toBe(0);
    expect(cancelled.body.purchase.items[0].receivedBaseQuantity).toBe(0);
    expect(await stockOf(product._id)).toBe(10);
    const out = await movementsFor(product._id, { type: "purchase", direction: "out" });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ quantity: 3, previousStock: 13, newStock: 10 });
  });

  test("repeated purchase cancellation does not reverse stock twice", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 3, { status: "Received" }));
    const url = `/api/purchases/${created.body.purchase._id}/status`;

    await request(app).patch(url).send({ status: "Cancelled" }).expect(200);
    await request(app).patch(url).send({ status: "Cancelled" }).expect(200);
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id, { type: "purchase", direction: "out" })).toHaveLength(1);
  });

  test("concurrent purchase cancellation reverses stock only once", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 3, { status: "Received" }));
    const url = `/api/purchases/${created.body.purchase._id}/status`;

    const results = await Promise.all([
      request(app).patch(url).send({ status: "Cancelled" }),
      request(app).patch(url).send({ status: "Cancelled" }),
    ]);

    expect(results.every((result) => result.status === 200)).toBe(true);
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id, { type: "purchase", direction: "out" })).toHaveLength(1);
  });

  test("deleting a cancelled purchase does not reverse stock again", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 3, { status: "Received" }));
    const id = created.body.purchase._id;

    await request(app).patch(`/api/purchases/${id}/status`).send({ status: "Cancelled" }).expect(200);
    expect((await request(app).delete(`/api/purchases/${id}`)).status).toBe(200);
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id, { type: "purchase", direction: "out" })).toHaveLength(1);
  });

  test("deleting a received purchase appends a compensating movement and keeps history", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 3, { status: "Received" }));
    const id = created.body.purchase._id;

    expect((await request(app).delete(`/api/purchases/${id}`)).status).toBe(200);
    expect(await stockOf(product._id)).toBe(10);
    const all = await movementsFor(product._id, { type: "purchase" });
    expect(all).toHaveLength(2);
    expect(all.filter((movement) => movement.direction === "in")).toHaveLength(1);
    expect(all.filter((movement) => movement.direction === "out")).toHaveLength(1);
    expect(all.find((movement) => movement.direction === "out").reference).toMatch(/DELETED/);
  });

  test("purchase deletion cannot drive stock negative", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 5 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 10, { status: "Received" }));
    await request(app).post("/api/sale-orders").send(salePayload(product, 10)).expect(201);
    expect(await stockOf(product._id)).toBe(5);

    const deleted = await request(app).delete(`/api/purchases/${created.body.purchase._id}`);
    expect(deleted.status).toBe(400);
    expect(await stockOf(product._id)).toBe(5);
    expect(await movementsFor(product._id, { type: "purchase", direction: "out" })).toHaveLength(0);
  });

  test("received purchase cannot regress to Draft while stock remains added", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 3, { status: "Received" }));

    const changed = await request(app)
      .patch(`/api/purchases/${created.body.purchase._id}/status`)
      .send({ status: "Draft" });

    expect(changed.status).toBe(400);
    expect(await stockOf(product._id)).toBe(13);
    expect(await movementsFor(product._id, { type: "purchase", direction: "out" })).toHaveLength(0);
  });

  test("plain purchase status update preserves recorded payment fields", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 3));
    const id = created.body.purchase._id;

    const paid = await request(app)
      .post(`/api/purchases/${id}/payment`)
      .set("Idempotency-Key", "phase3-purchase-payment")
      .send({ amount: 5, method: "Cash" });
    expect(paid.status).toBe(200);

    const statusChange = await request(app)
      .patch(`/api/purchases/${id}/status`)
      .send({ status: "Ordered" });
    expect(statusChange.status).toBe(200);

    const saved = await Purchase.findById(id).lean();
    expect(saved.payments).toHaveLength(1);
    expect(saved.paidAmount).toBe(5);
    expect(await stockOf(product._id)).toBe(10);
  });

  test("purchase quantity edit adds only the received base-piece delta", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 2, { status: "Received" }));

    const updated = await request(app)
      .put(`/api/purchases/${created.body.purchase._id}`)
      .send(purchasePayload(supplier, product, 4, { status: "Received" }));

    expect(updated.status).toBe(200);
    expect(await stockOf(product._id)).toBe(14);
    const movements = await movementsFor(product._id, {
      type: "purchase",
      direction: "in",
    });
    expect(movements).toHaveLength(2);
    expect(movements[1]).toMatchObject({ quantity: 2, previousStock: 12, newStock: 14 });
  });

  test("cancelling a purchase through edit clears counters and cannot reverse twice", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 3, { status: "Received" }));
    const id = created.body.purchase._id;

    const cancelled = await request(app)
      .put(`/api/purchases/${id}`)
      .send(purchasePayload(supplier, product, 3, { status: "Cancelled" }));
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.purchase.items[0].receivedQuantity).toBe(0);
    expect(cancelled.body.purchase.items[0].receivedBaseQuantity).toBe(0);
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id, { type: "purchase", direction: "out" })).toHaveLength(1);

    expect((await request(app).delete(`/api/purchases/${id}`)).status).toBe(200);
    expect(await stockOf(product._id)).toBe(10);
    expect(await movementsFor(product._id, { type: "purchase", direction: "out" })).toHaveLength(1);
  });

  test("received purchase cannot regress to Ordered through edit", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 3, { status: "Received" }));

    const changed = await request(app)
      .put(`/api/purchases/${created.body.purchase._id}`)
      .send(purchasePayload(supplier, product, 3, { status: "Ordered" }));

    expect(changed.status).toBe(400);
    expect(await stockOf(product._id)).toBe(13);
    expect(await movementsFor(product._id, { type: "purchase", direction: "out" })).toHaveLength(0);
  });

  test("product with sale history cannot be deleted and keeps the stock ledger", async () => {
    const product = await seedProduct({ openingStock: 20 });
    const created = await request(app)
      .post("/api/sale-orders")
      .send(salePayload(product, 2));
    expect(created.status).toBe(201);

    const stockBefore = await stockOf(product._id);
    const saleMovementsBefore = await movementsFor(product._id, {
      type: "sale",
      direction: "out",
    });
    expect(saleMovementsBefore).toHaveLength(1);

    const response = await request(app).delete(`/api/products/${product._id}`);
    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/sale or purchase history/i);
    expect(await Product.findById(product._id)).not.toBeNull();
    expect(await SaleOrder.findById(created.body.order._id)).not.toBeNull();
    expect(await stockOf(product._id)).toBe(stockBefore);
    expect(await movementsFor(product._id, { type: "sale", direction: "out" })).toHaveLength(1);
  });

  test("product with purchase history cannot be deleted", async () => {
    const supplier = await seedSupplier();
    const product = await seedProduct({ openingStock: 10 });
    const created = await request(app)
      .post("/api/purchases")
      .send(purchasePayload(supplier, product, 3));
    expect(created.status).toBe(201);

    const response = await request(app).delete(`/api/products/${product._id}`);
    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/sale or purchase history/i);
    expect(await Product.findById(product._id)).not.toBeNull();
    expect(await Purchase.findById(created.body.purchase._id)).not.toBeNull();
  });

  test("product without sale or purchase history can still be deleted", async () => {
    const product = await seedProduct({ openingStock: 4 });

    const response = await request(app).delete(`/api/products/${product._id}`);
    expect(response.status).toBe(200);
    expect(await Product.findById(product._id)).toBeNull();
  });
});
