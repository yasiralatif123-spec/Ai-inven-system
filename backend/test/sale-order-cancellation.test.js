const request = require("supertest");
const app = require("../src/app");
const Product = require("../src/models/Product");
const SaleOrder = require("../src/models/SaleOrder");
const StockMovement = require("../src/models/StockMovement");
const { connectTestDB, clearTestDB, disconnectTestDB } = require("./helpers/test-db");
const { seedCustomer } = require("./helpers/customers");

let defaultCustomer = null;

async function createProduct(overrides = {}) {
  return Product.create({
    title: "Cancellation Widget",
    sku: `CANCEL-${Math.random().toString(36).slice(2, 10)}`,
    category: "Test",
    brand: "Test Brand",
    openingStock: 10,
    reorderThreshold: 2,
    wholesalePrice: 50,
    purchasePrice: 40,
    ...overrides,
  });
}

function salePayload(product, overrides = {}) {
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

async function createOrder(product, overrides = {}) {
  const res = await request(app).post("/api/sale-orders").send(salePayload(product, overrides));
  expect(res.status).toBe(201);
  return res.body.order;
}

async function stockOf(productId) {
  const product = await Product.findById(productId);
  return product.openingStock;
}

async function restorationMovements(productId) {
  return StockMovement.find({
    product: productId,
    type: "sale",
    direction: "in",
  }).lean();
}

async function orderStatus(orderId) {
  const order = await SaleOrder.findById(orderId);
  return order?.status ?? null;
}

describe("sale order cancellation", () => {
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

  test("cancelling a pending order restores stock exactly once and clears stockDeducted", async () => {
    const product = await createProduct();
    const order = await createOrder(product);
    expect(await stockOf(product._id)).toBe(8);

    const first = await request(app)
      .patch(`/api/sale-orders/${order._id}/status`)
      .send({ status: "Cancelled" });
    expect(first.status).toBe(200);
    expect(first.body.order.status).toBe("Cancelled");
    expect(first.body.order.items[0].stockDeducted).toBe(false);
    expect(await stockOf(product._id)).toBe(10);
    expect(await restorationMovements(product._id)).toHaveLength(1);

    const repeated = await request(app)
      .patch(`/api/sale-orders/${order._id}/status`)
      .send({ status: "Cancelled" });
    expect(repeated.status).toBe(200);
    expect(await stockOf(product._id)).toBe(10);
    expect(await restorationMovements(product._id)).toHaveLength(1);
  });

  test("cancelling a delivered order does not restore stock", async () => {
    const product = await createProduct();
    const order = await createOrder(product);

    const delivered = await request(app)
      .patch(`/api/sale-orders/${order._id}/status`)
      .send({ status: "Delivered" });
    expect(delivered.status).toBe(200);
    expect(await stockOf(product._id)).toBe(8);

    const cancelled = await request(app)
      .patch(`/api/sale-orders/${order._id}/status`)
      .send({ status: "Cancelled" });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.order.status).toBe("Cancelled");
    expect(await stockOf(product._id)).toBe(8);
    expect(await restorationMovements(product._id)).toHaveLength(0);
  });

  test("deleting an already cancelled order does not restore stock again", async () => {
    const product = await createProduct();
    const order = await createOrder(product);

    const cancelled = await request(app)
      .patch(`/api/sale-orders/${order._id}/status`)
      .send({ status: "Cancelled" });
    expect(cancelled.status).toBe(200);
    expect(await stockOf(product._id)).toBe(10);
    expect(await restorationMovements(product._id)).toHaveLength(1);

    const deleted = await request(app).delete(`/api/sale-orders/${order._id}`);
    expect(deleted.status).toBe(200);
    expect(await stockOf(product._id)).toBe(10);
    expect(await restorationMovements(product._id)).toHaveLength(1);
    expect(await SaleOrder.countDocuments()).toBe(0);
  });

  test("cancelled orders cannot be reactivated or edited", async () => {
    const product = await createProduct();
    const order = await createOrder(product);
    await request(app)
      .patch(`/api/sale-orders/${order._id}/status`)
      .send({ status: "Cancelled" })
      .expect(200);

    const reactivate = await request(app)
      .patch(`/api/sale-orders/${order._id}/status`)
      .send({ status: "Processing" });
    expect(reactivate.status).toBe(400);
    expect(reactivate.body.message).toMatch(/cannot be reactivated/i);
    expect(await orderStatus(order._id)).toBe("Cancelled");

    const edit = await request(app)
      .put(`/api/sale-orders/${order._id}`)
      .send(salePayload(product, { status: "Processing" }));
    expect(edit.status).toBe(400);
    expect(edit.body.message).toMatch(/cannot be edited/i);
    expect(await orderStatus(order._id)).toBe("Cancelled");
  });

  test("payments cannot be recorded against cancelled orders", async () => {
    const product = await createProduct();
    const order = await createOrder(product);
    await request(app)
      .patch(`/api/sale-orders/${order._id}/status`)
      .send({ status: "Cancelled" })
      .expect(200);

    const payment = await request(app)
      .post(`/api/sale-orders/${order._id}/payment`)
      .send({ amount: 100, method: "Cash" });
    expect(payment.status).toBe(400);
    expect(payment.body.message).toMatch(/cancelled sale order/i);

    const saved = await SaleOrder.findById(order._id);
    expect(saved.financials.paid).toBe(0);
    expect(saved.financials.outstanding).toBe(100);
  });

  test("new orders cannot be created with Cancelled status", async () => {
    const product = await createProduct();

    const create = await request(app)
      .post("/api/sale-orders")
      .send(salePayload(product, { status: "Cancelled" }));
    expect(create.status).toBe(400);
    expect(create.body.message).toMatch(/Cancel action/i);
    expect(await SaleOrder.countDocuments()).toBe(0);
    expect(await stockOf(product._id)).toBe(10);

    const order = await createOrder(product);
    const edit = await request(app)
      .put(`/api/sale-orders/${order._id}`)
      .send(salePayload(product, { status: "Cancelled" }));
    expect(edit.status).toBe(400);
    expect(edit.body.message).toMatch(/Cancel action/i);
    expect(await orderStatus(order._id)).toBe("Pending Approval");
  });
});
