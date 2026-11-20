const express = require("express");
const upload = require("../middlewares/upload.middleware");
const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");
const { adjustStock } = require("../controllers/inventory.controller");

const router = express.Router();

router.get("/", getProducts);
router.post("/", upload.single("image"), createProduct);
router.post("/:id/adjust-stock", adjustStock);
router.put("/:id", upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;