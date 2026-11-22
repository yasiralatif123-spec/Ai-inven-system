const express = require("express");
const upload = require("../middlewares/upload.middleware");
const { enforceTenantAuth } = require("../middlewares/enforcement.middleware");
const {
  createProduct,
  getProducts,
  getProductById,
  getProductBySku,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");
const { adjustStock } = require("../controllers/inventory.controller");

const router = express.Router();

router.use(enforceTenantAuth);

router.get("/", getProducts);
router.get("/sku/:sku", getProductBySku);
router.get("/:id", getProductById);
router.post("/", upload.single("image"), createProduct);
router.post("/:id/adjust-stock", adjustStock);
router.put("/:id", upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;