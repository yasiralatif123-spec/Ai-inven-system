const express = require("express");
const { enforceTenantAuth } = require("../middlewares/enforcement.middleware");
const {
  listBrands,
  getBrandById,
  createBrand,
  updateBrand,
  updateBrandStatus,
} = require("../controllers/brand.controller");

const router = express.Router();

router.use(enforceTenantAuth);

router.get("/", listBrands);
router.post("/", createBrand);
router.patch("/:id/status", updateBrandStatus);
router.get("/:id", getBrandById);
router.put("/:id", updateBrand);

module.exports = router;
