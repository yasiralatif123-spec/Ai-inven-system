const express = require("express");
const {
  enforceTenantAuth,
  requireRoleWhenEnforced,
} = require("../middlewares/enforcement.middleware");
const {
  getNextPurchaseCode,
  getPurchases,
  getPurchaseById,
  getPurchaseByNumber,
  createPurchase,
  updatePurchase,
  updatePurchaseStatus,
  receivePurchase,
  recordPurchasePayment,
  deletePurchase,
} = require("../controllers/purchase.controller");

const router = express.Router();
const sensitive = requireRoleWhenEnforced("owner", "admin");

router.use(enforceTenantAuth);

router.get("/next-code", getNextPurchaseCode);
router.get("/", getPurchases);
router.get("/number/:purchaseNumber", getPurchaseByNumber);
router.get("/:id", getPurchaseById);
router.post("/", sensitive, createPurchase);
router.put("/:id", sensitive, updatePurchase);
router.patch("/:id/status", sensitive, updatePurchaseStatus);
router.post("/:id/receive", sensitive, receivePurchase);
router.post("/:id/payment", sensitive, recordPurchasePayment);
router.delete("/:id", sensitive, deletePurchase);

module.exports = router;
