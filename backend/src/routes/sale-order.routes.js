const express = require("express");
const {
  enforceTenantAuth,
  requireRoleWhenEnforced,
} = require("../middlewares/enforcement.middleware");
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
const sensitive = requireRoleWhenEnforced("owner", "admin");

router.use(enforceTenantAuth);

router.get("/", getSaleOrders);
router.get("/number/:orderNumber", getSaleOrderByNumber);
router.get("/:id", getSaleOrderById);
router.post("/", sensitive, createSaleOrder);
router.put("/:id", sensitive, updateSaleOrder);
router.patch("/:id/status", sensitive, updateSaleOrderStatus);
router.post("/:id/payment", sensitive, recordSaleOrderPayment);
router.delete("/:id", sensitive, deleteSaleOrder);

module.exports = router;
