const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const saleOrderRoutes = require("./routes/sale-order.routes");
const supplierRoutes = require("./routes/supplier.routes");
const customerRoutes = require("./routes/customer.routes");
const purchaseRoutes = require("./routes/purchase.routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

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
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(
  session({
    name: process.env.SESSION_NAME || "inv.sid",
    secret: process.env.SESSION_SECRET || "change_this_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.SESSION_SECURE === "true",
      sameSite: process.env.SESSION_SAME_SITE || "lax",
      maxAge: Number(process.env.SESSION_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000,
    },
    // TODO: configure a production session store (e.g. connect-mongo / Redis)
  })
);

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

app.use(errorHandler);

module.exports = app;
