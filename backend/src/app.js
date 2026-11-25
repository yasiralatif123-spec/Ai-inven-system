const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const saleOrderRoutes = require("./routes/sale-order.routes");
const supplierRoutes = require("./routes/supplier.routes");
const customerRoutes = require("./routes/customer.routes");
const purchaseRoutes = require("./routes/purchase.routes");
const brandRoutes = require("./routes/brand.routes");
const errorHandler = require("./middlewares/error.middleware");
const { checkOrigin } = require("./middlewares/origin.middleware");

const app = express();

// Required for correct client-IP rate limiting behind the Next.js /api rewrite.
// Must be a numeric hop count, never `true`.
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));

app.use(helmet());

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser tools (no origin) and allowed local/frontend origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkOrigin);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sale-orders", saleOrderRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/brands", brandRoutes);

app.use(errorHandler);

module.exports = app;
