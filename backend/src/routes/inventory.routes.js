const express = require("express");
const { enforceTenantAuth } = require("../middlewares/enforcement.middleware");
const {
  getMovements,
  deleteStockMovement,
} = require("../controllers/inventory.controller");

const router = express.Router();

router.use(enforceTenantAuth);

router.get("/movements", getMovements);
router.delete("/movements/:id", deleteStockMovement);

module.exports = router;
