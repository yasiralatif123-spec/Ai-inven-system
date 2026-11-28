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

function productApiPayload(overrides = {}) {
  return {
    title: "Priced Widget",
    sku: randomSku("PRICE"),
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

async function createProduct(overrides = {}) {
  return Product.create({
    title: "Priced Widget",
    sku: randomSku("STOCK"),
    category: "Test",
    brand: "Test Brand",
    reorderThreshold: 5,
    priceUnit: "Piece",
    uom: "Piece",
    purchasePrice: 10,
    wholesalePrice: 10,
    retailPrice: 15,
    openingStock: 100,
    ...overrides,
  });
}

async function createSupplier() {
  return Supplier.create({
    supplierCode: randomSku("SUP"),
    name: "Test Supplier",
    contactPerson: "Test Contact",
    phone: "+92 3001234567",
    address: "Test Address",
    paymentTerms: "net-15",
  });
}

function salePayload(items, overrides = {}) {
  return {
    customerId: String(defaultCustomer._id),
    customer: defaultCustomer.name,
    phone: defaultCustomer.phone,
    paymentStatus: "unpaid",
    paymentMethod: "Cash",
    status: "Pending Approval",
    items,
    discount: 0,
    freight: 0,
    ...overrides,
  };
}

function purchasePayload(supplier, items, overrides = {}) {
  return {
    supplierId: String(supplier._id),
    purchaseDate: "2026-01-01",
    expectedDelivery: "2026-01-05",
    invoiceNumber: "INV-1",
    status: "Draft",
    freight: 0,
    items,
    ...overrides,
  };
}

describe("unit-based pricing contract", () => {
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

  describe("product prices", () => {
    test("create converts entered unit prices into canonical per-Piece prices", async () => {
      const response = await request(app)
        .post("/api/products")
        .send(
          productApiPayload({
            priceUnit: "Carton",
            uom: "Carton",
            purchasePrice: 240,
            wholesalePrice: 360,
            retailPrice: 480,
          })
        );

      expect(response.status).toBe(201);
      expect(response.body.product).toMatchObject({
        priceUnit: "Carton",
        uom: "Carton",
        purchasePrice: 10,
        wholesalePrice: 15,
        retailPrice: 20,
      });
    });

    test("update reconverts entered unit prices into canonical per-Piece prices", async () => {
      const created = await request(app)
        .post("/api/products")
        .send(productApiPayload());
      expect(created.status).toBe(201);

      const response = await request(app)
        .put(`/api/products/${created.body.product._id}`)
        .send(
          productApiPayload({
            priceUnit: "Box",
            uom: "Box",
            purchasePrice: 120,
            wholesalePrice: 180,
            retailPrice: 240,
          })
        );

      expect(response.status).toBe(200);
      expect(response.body.product).toMatchObject({
        priceUnit: "Box",
        uom: "Box",
        purchasePrice: 10,
        wholesalePrice: 15,
        retailPrice: 20,
      });
    });

    test("stores canonical prices supplied by the product form", async () => {
      const response = await request(app)
        .post("/api/products")
        .send(
          productApiPayload({
            priceUnit: "Carton",
            uom: "Carton",
            purchasePrice: 1000,
            wholesalePrice: 1500,
            retailPrice: 2000,
            canonicalPrices: {
              purchasePrice: 41.66666667,
              wholesalePrice: 62.5,
              retailPrice: 83.33333333,
            },
          })
        );

      expect(response.status).toBe(201);
      expect(response.body.product.purchasePrice).toBeCloseTo(41.66666667, 8);
      expect(response.body.product.wholesalePrice).toBe(62.5);
      expect(response.body.product.retailPrice).toBeCloseTo(83.33333333, 8);

      const saved = await Product.findById(response.body.product._id).lean();
      expect(saved.purchasePrice).toBeCloseTo(41.66666667, 8);
      expect(saved.wholesalePrice).toBe(62.5);
      expect(saved.retailPrice).toBeCloseTo(83.33333333, 8);
    });

    test("saving after switching to a smaller unit keeps canonical prices", async () => {
      const created = await request(app)
        .post("/api/products")
        .send(
          productApiPayload({
            priceUnit: "Carton",
            uom: "Carton",
            purchasePrice: 1000,
            wholesalePrice: 1500,
            retailPrice: 2000,
            canonicalPrices: {
              purchasePrice: 41.66666667,
              wholesalePrice: 62.5,
              retailPrice: 83.33333333,
            },
          })
        );
      expect(created.status).toBe(201);

      // Piece displays are rounded for the user, but the form also sends the
      // canonical values so saving must not overwrite them with 41.67 / 83.33.
      const response = await request(app)
        .put(`/api/products/${created.body.product._id}`)
        .send(
          productApiPayload({
            priceUnit: "Piece",
            uom: "Piece",
            purchasePrice: 41.67,
            wholesalePrice: 62.5,
            retailPrice: 83.33,
            canonicalPurchasePrice: 41.66666667,
            canonicalWholesalePrice: 62.5,
            canonicalRetailPrice: 83.33333333,
          })
        );

      expect(response.status).toBe(200);
      expect(response.body.product.priceUnit).toBe("Piece");
      expect(response.body.product.purchasePrice).toBeCloseTo(41.66666667, 8);
      expect(response.body.product.wholesalePrice).toBe(62.5);
      expect(response.body.product.retailPrice).toBeCloseTo(83.33333333, 8);
    });

    test("legacy clients without canonical prices still convert display prices", async () => {
      const response = await request(app)
        .post("/api/products")
        .send(
          productApiPayload({
            priceUnit: "Carton",
            uom: "Carton",
            purchasePrice: 240,
            wholesalePrice: 360,
            retailPrice: 480,
          })
        );

      expect(response.status).toBe(201);
      expect(response.body.product).toMatchObject({
        purchasePrice: 10,
        wholesalePrice: 15,
        retailPrice: 20,
      });
    });

    test("ignores legacy taxBracket payloads", async () => {
      const response = await request(app)
        .post("/api/products")
        .send(productApiPayload({ taxBracket: "Standard Sales Tax (18% FBR SRO)" }));

      expect(response.status).toBe(201);
      expect(response.body.product).not.toHaveProperty("taxBracket");

      const saved = await Product.findById(response.body.product._id).lean();
      expect(saved).not.toHaveProperty("taxBracket");
    });

    test.each([
      ["NaN", "NaN"],
      ["Infinity", "Infinity"],
      ["negative", -1],
      ["malformed", "12abc"],
      ["object", {}],
    ])("rejects %s purchase price", async (_label, value) => {
      const response = await request(app)
        .post("/api/products")
        .send(productApiPayload({ purchasePrice: value }));

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/finite, non-negative/i);
    });

    test("update rejects malformed prices without changing the product", async () => {
      const created = await request(app)
        .post("/api/products")
        .send(productApiPayload());
      expect(created.status).toBe(201);

      const response = await request(app)
        .put(`/api/products/${created.body.product._id}`)
        .send(productApiPayload({ wholesalePrice: "abc" }));

      expect(response.status).toBe(400);
      const saved = await Product.findById(created.body.product._id);
      expect(saved.wholesalePrice).toBe(20);
    });

    test("rejects unsupported pricing and stock units", async () => {
      const badPriceUnit = await request(app)
        .post("/api/products")
        .send(productApiPayload({ priceUnit: "Dozen" }));
      expect(badPriceUnit.status).toBe(400);

      const badUom = await request(app)
        .post("/api/products")
        .send(productApiPayload({ uom: "Carton / Master Case" }));
      expect(badUom.status).toBe(400);
    });
  });

  describe("sale lines", () => {
    test("derives catalog line prices from canonical per-Piece prices", async () => {
      const product = await createProduct({ wholesalePrice: 10, uom: "Carton" });
      const response = await request(app)
        .post("/api/sale-orders")
        .send(
          salePayload([
            {
              name: product.title,
              sku: product.sku,
              productId: String(product._id),
              quantity: 1,
              unitLabel: "Carton",
              unitPrice: 999,
            },
          ])
        );

      expect(response.status).toBe(201);
      const [item] = response.body.order.items;
      expect(item).toMatchObject({
        priceBasis: "catalog",
        basePrice: 10,
        unitPrice: 240,
        lineTotal: 240,
      });

      const saved = await Product.findById(product._id);
      expect(saved.openingStock).toBe(76);
    });

    test("1 Carton and 24 Pieces produce the same catalog sale total", async () => {
      const product = await createProduct({
        wholesalePrice: 41.66666667,
        uom: "Piece",
        openingStock: 1000,
      });

      const carton = await request(app)
        .post("/api/sale-orders")
        .send(
          salePayload(
            [
              {
                name: product.title,
                sku: product.sku,
                productId: String(product._id),
                quantity: 1,
                unitLabel: "Carton",
                unitPrice: 999,
              },
            ],
            { discount: 100 }
          )
        );
      const pieces = await request(app)
        .post("/api/sale-orders")
        .send(
          salePayload(
            [
              {
                name: product.title,
                sku: product.sku,
                productId: String(product._id),
                quantity: 24,
                unitLabel: "Piece",
                unitPrice: 999,
              },
            ],
            { discount: 100 }
          )
        );

      expect(carton.status).toBe(201);
      expect(pieces.status).toBe(201);
      expect(carton.body.order.items[0].basePrice).toBeCloseTo(41.66666667, 8);
      expect(carton.body.order.items[0].unitPrice).toBe(1000);
      expect(pieces.body.order.items[0].unitPrice).toBe(41.67);
      expect(carton.body.order.items[0].lineTotal).toBe(1000);
      expect(pieces.body.order.items[0].lineTotal).toBe(1000);
      expect(carton.body.order.financials.subtotal).toBe(1000);
      expect(pieces.body.order.financials.subtotal).toBe(1000);
      expect(carton.body.order.financials.total).toBe(900);
      expect(pieces.body.order.financials.total).toBe(900);
    });

    test("accepts decimal unit prices on catalog sale lines", async () => {
      const product = await createProduct({ wholesalePrice: 62.5, uom: "Piece" });
      const response = await request(app)
        .post("/api/sale-orders")
        .send(
          salePayload(
            [
              {
                name: product.title,
                sku: product.sku,
                productId: String(product._id),
                quantity: 1,
                unitLabel: "Piece",
                unitPrice: 999,
              },
            ],
            { discount: 2.5, freight: 1.25 }
          )
        );

      expect(response.status).toBe(201);
      const [item] = response.body.order.items;
      expect(item.priceBasis).toBe("catalog");
      expect(item.unitPrice).toBe(62.5);
      expect(item.lineTotal).toBe(62.5);
      expect(response.body.order.financials.subtotal).toBe(62.5);
      expect(response.body.order.financials.discount).toBe(2.5);
      expect(response.body.order.financials.freight).toBe(1.25);
      expect(response.body.order.financials.total).toBe(61.25);
    });

    test("omits tax from sale order financials", async () => {
      const product = await createProduct({ wholesalePrice: 10, uom: "Piece" });
      const response = await request(app)
        .post("/api/sale-orders")
        .send(
          salePayload(
            [
              {
                name: product.title,
                sku: product.sku,
                productId: String(product._id),
                quantity: 2,
                unitLabel: "Piece",
                unitPrice: 999,
              },
            ],
            { discount: 5, freight: 3 }
          )
        );

      expect(response.status).toBe(201);
      expect(response.body.order.financials).not.toHaveProperty("tax");
      expect(response.body.order.financials.total).toBe(18);
    });

    test("quantity changes preserve the saved catalog snapshot", async () => {
      const product = await createProduct({ wholesalePrice: 10, uom: "Carton" });
      const created = await request(app)
        .post("/api/sale-orders")
        .send(
          salePayload([
            {
              name: product.title,
              sku: product.sku,
              productId: String(product._id),
              quantity: 1,
              unitLabel: "Carton",
              unitPrice: 999,
            },
          ])
        );
      expect(created.status).toBe(201);

      await Product.updateOne({ _id: product._id }, { $set: { wholesalePrice: 20 } });
      const updated = await request(app)
        .put(`/api/sale-orders/${created.body.order._id}`)
        .send(
          salePayload([
            {
              name: product.title,
              sku: product.sku,
              productId: String(product._id),
              quantity: 2,
              unitLabel: "Carton",
              unitPrice: 0,
            },
          ])
        );

      expect(updated.status).toBe(200);
      const [item] = updated.body.order.items;
      expect(item).toMatchObject({ basePrice: 10, unitPrice: 240, lineTotal: 480 });
    });

    test("preserves an explicitly saved zero catalog price", async () => {
      const product = await createProduct({ wholesalePrice: 0, uom: "Carton" });
      const otherProduct = await createProduct({ wholesalePrice: 5, uom: "Piece" });
      const items = [
        {
          name: product.title,
          sku: product.sku,
          productId: String(product._id),
          quantity: 1,
          unitLabel: "Carton",
          unitPrice: 999,
        },
        {
          name: otherProduct.title,
          sku: otherProduct.sku,
          productId: String(otherProduct._id),
          quantity: 1,
          unitLabel: "Piece",
          unitPrice: 50,
        },
      ];
      const created = await request(app).post("/api/sale-orders").send(salePayload(items));
      expect(created.status).toBe(201);

      await Product.updateOne({ _id: product._id }, { $set: { wholesalePrice: 20 } });
      const updated = await request(app)
        .put(`/api/sale-orders/${created.body.order._id}`)
        .send(salePayload(items));

      expect(updated.status).toBe(200);
      expect(updated.body.order.items[0]).toMatchObject({
        priceBasis: "catalog",
        basePrice: 0,
        unitPrice: 0,
        lineTotal: 0,
      });
    });

    test("reprices a manual line once it is linked to a catalog product", async () => {
      const product = await createProduct({ wholesalePrice: 10, uom: "Carton" });
      const created = await request(app)
        .post("/api/sale-orders")
        .send(
          salePayload([
            {
              name: product.title,
              sku: product.sku,
              productId: String(product._id),
              quantity: 1,
              unitLabel: "Carton",
              unitPrice: 75,
            },
          ])
        );
      expect(created.status).toBe(201);

      await SaleOrder.updateOne(
        { _id: created.body.order._id },
        {
          $set: {
            "items.0.priceBasis": "manual",
            "items.0.basePrice": 75,
            "items.0.unitPrice": 75,
            "items.0.lineTotal": 75,
          },
        }
      );

      const updated = await request(app)
        .put(`/api/sale-orders/${created.body.order._id}`)
        .send(
          salePayload([
            {
              name: product.title,
              sku: product.sku,
              productId: String(product._id),
              quantity: 1,
              unitLabel: "Carton",
              unitPrice: 999,
            },
          ])
        );

      expect(updated.status).toBe(200);
      expect(updated.body.order.items[0]).toMatchObject({
        priceBasis: "catalog",
        basePrice: 10,
        unitPrice: 240,
        lineTotal: 240,
      });
    });

    test("rejects sale lines without a saved catalog product", async () => {
      const response = await request(app)
        .post("/api/sale-orders")
        .send(
          salePayload([
            {
              name: "Custom Service",
              sku: "",
              productId: "",
              quantity: 3,
              unitLabel: "Piece",
              unitPrice: 75,
            },
          ])
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/not found in this business/i);
      expect(await SaleOrder.countDocuments()).toBe(0);
    });

    test("rejects malformed manual item prices", async () => {
      const response = await request(app)
        .post("/api/sale-orders")
        .send(
          salePayload([
            {
              name: "Custom Service",
              sku: "",
              productId: "",
              quantity: 1,
              unitLabel: "Piece",
              unitPrice: "abc",
            },
          ])
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/finite, non-negative/i);
      expect(await SaleOrder.countDocuments()).toBe(0);
    });
  });

  describe("purchase lines", () => {
    test("derives catalog prices and stock movements in base Pieces", async () => {
      const supplier = await createSupplier();
      const product = await createProduct({
        purchasePrice: 10,
        uom: "Carton",
        openingStock: 0,
      });
      const response = await request(app)
        .post("/api/purchases")
        .send(
          purchasePayload(
            supplier,
            [
              {
                name: product.title,
                sku: product.sku,
                productId: String(product._id),
                quantity: 2,
                unit: "Carton",
                unitPrice: 999,
                discount: 0,
                taxRate: 0,
              },
            ],
            { status: "Received" }
          )
        );

      expect(response.status).toBe(201);
      const [item] = response.body.purchase.items;
      expect(item).toMatchObject({
        priceBasis: "catalog",
        basePrice: 10,
        unitPrice: 240,
        baseQuantity: 48,
        receivedBaseQuantity: 48,
      });
      expect(response.body.purchase.financials.subtotal).toBe(480);

      const saved = await Product.findById(product._id);
      expect(saved.openingStock).toBe(48);
      const movements = await StockMovement.find({ product: product._id }).lean();
      expect(movements).toHaveLength(1);
      expect(movements[0].quantity).toBe(48);
    });

    test("1 Carton and 24 Pieces produce the same catalog purchase total", async () => {
      const supplier = await createSupplier();
      const product = await createProduct({
        purchasePrice: 41.66666667,
        uom: "Piece",
        openingStock: 0,
      });

      const carton = await request(app)
        .post("/api/purchases")
        .send(
          purchasePayload(
            supplier,
            [
              {
                name: product.title,
                sku: product.sku,
                productId: String(product._id),
                quantity: 1,
                unit: "Carton",
                unitPrice: 999,
                discount: 100,
              },
            ],
            { freight: 5 }
          )
        );
      const pieces = await request(app)
        .post("/api/purchases")
        .send(
          purchasePayload(
            supplier,
            [
              {
                name: product.title,
                sku: product.sku,
                productId: String(product._id),
                quantity: 24,
                unit: "Piece",
                unitPrice: 999,
                discount: 100,
              },
            ],
            { freight: 5 }
          )
        );

      expect(carton.status).toBe(201);
      expect(pieces.status).toBe(201);
      expect(carton.body.purchase.items[0].basePrice).toBeCloseTo(41.66666667, 8);
      expect(carton.body.purchase.items[0].unitPrice).toBe(1000);
      expect(pieces.body.purchase.items[0].unitPrice).toBe(41.67);
      expect(carton.body.purchase.items[0].lineTotal).toBe(900);
      expect(pieces.body.purchase.items[0].lineTotal).toBe(900);
      expect(carton.body.purchase.financials.subtotal).toBe(1000);
      expect(pieces.body.purchase.financials.subtotal).toBe(1000);
      expect(carton.body.purchase.financials.total).toBe(905);
      expect(pieces.body.purchase.financials.total).toBe(905);
    });

    test("manual purchase items keep their explicit price", async () => {
      const supplier = await createSupplier();
      const response = await request(app)
        .post("/api/purchases")
        .send(
          purchasePayload(supplier, [
            {
              name: "Freight Service",
              sku: "",
              productId: "",
              quantity: 2,
              unit: "Box",
              unitPrice: 150,
              discount: 0,
              taxRate: 0,
            },
          ])
        );

      expect(response.status).toBe(201);
      const [item] = response.body.purchase.items;
      expect(item).toMatchObject({ priceBasis: "manual", unitPrice: 150 });
      expect(await Purchase.countDocuments()).toBe(1);
    });

    test("editing a purchase preserves the saved catalog snapshot", async () => {
      const supplier = await createSupplier();
      const product = await createProduct({ purchasePrice: 10, uom: "Carton" });
      const created = await request(app)
        .post("/api/purchases")
        .send(
          purchasePayload(supplier, [
            {
              name: product.title,
              sku: product.sku,
              productId: String(product._id),
              quantity: 2,
              unit: "Carton",
              unitPrice: 999,
              discount: 0,
              taxRate: 0,
            },
          ])
        );
      expect(created.status).toBe(201);
      const originalItem = created.body.purchase.items[0];

      await Product.updateOne({ _id: product._id }, { $set: { purchasePrice: 20 } });
      const updated = await request(app)
        .put(`/api/purchases/${created.body.purchase._id}`)
        .send(
          purchasePayload(
            supplier,
            [
              {
                id: originalItem.id,
                itemIndex: 0,
                name: product.title,
                sku: product.sku,
                productId: String(product._id),
                quantity: 2,
                unit: "Carton",
                unitPrice: 0,
                discount: 0,
                taxRate: 0,
              },
            ]
          )
        );

      expect(updated.status).toBe(200);
      const [item] = updated.body.purchase.items;
      expect(item).toMatchObject({ basePrice: 10, unitPrice: 240 });
    });

    test("ignores legacy taxRate and computes tax-free totals", async () => {
      const supplier = await createSupplier();
      const product = await createProduct({ purchasePrice: 10, uom: "Piece" });
      const response = await request(app)
        .post("/api/purchases")
        .send(
          purchasePayload(
            supplier,
            [
              {
                name: product.title,
                sku: product.sku,
                productId: String(product._id),
                quantity: 2,
                unit: "Piece",
                unitPrice: 999,
                discount: 1,
                taxRate: 18,
              },
            ],
            { freight: 2 }
          )
        );

      expect(response.status).toBe(201);
      const purchase = response.body.purchase;
      expect(purchase.financials).toMatchObject({
        subtotal: 20,
        discount: 1,
        freight: 2,
        total: 21,
      });
      expect(purchase.financials).not.toHaveProperty("tax");
      expect(purchase.items[0]).not.toHaveProperty("taxRate");
      expect(purchase.items[0]).not.toHaveProperty("taxAmount");
      expect(purchase.items[0].lineTotal).toBe(19);

      const saved = await Purchase.findById(purchase._id).lean();
      expect(saved.financials).not.toHaveProperty("tax");
      expect(saved.items[0]).not.toHaveProperty("taxRate");
      expect(saved.items[0]).not.toHaveProperty("taxAmount");
    });
  });
});
