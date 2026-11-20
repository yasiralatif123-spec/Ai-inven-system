const express = require("express");
const {
  getMovements,
  deleteStockMovement,
} = require("../controllers/inventory.controller");

const router = express.Router();

router.get("/movements", getMovements);
router.delete("/movements/:id", deleteStockMovement);

module.exports = router;
