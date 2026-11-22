const express = require("express");
const { enforceTenantAuth } = require("../middlewares/enforcement.middleware");
const {
  createSaleOrder,
  updateSaleOrder,
  getSaleOrders,
  getSaleOrderById,
  getSaleOrderByNumber,
  updateSaleOrderStatus,
  recordSaleOrderPayment,
  deleteSaleOrder,
} = require("../controllers/sale-order.controller");

const router = express.Router();

router.use(enforceTenantAuth);

router.get("/", getSaleOrders);
router.get("/number/:orderNumber", getSaleOrderByNumber);
router.get("/:id", getSaleOrderById);
router.post("/", createSaleOrder);
router.put("/:id", updateSaleOrder);
router.patch("/:id/status", updateSaleOrderStatus);
router.post("/:id/payment", recordSaleOrderPayment);
router.delete("/:id", deleteSaleOrder);

module.exports = router;
