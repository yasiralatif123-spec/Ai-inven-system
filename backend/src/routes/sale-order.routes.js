const express = require("express");
const {
  createSaleOrder,
  updateSaleOrder,
  getSaleOrders,
  updateSaleOrderStatus,
  recordSaleOrderPayment,
  deleteSaleOrder,
} = require("../controllers/sale-order.controller");

const router = express.Router();

router.get("/", getSaleOrders);
router.post("/", createSaleOrder);
router.put("/:id", updateSaleOrder);
router.patch("/:id/status", updateSaleOrderStatus);
router.post("/:id/payment", recordSaleOrderPayment);
router.delete("/:id", deleteSaleOrder);

module.exports = router;
