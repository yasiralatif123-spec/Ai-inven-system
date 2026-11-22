const express = require("express");
const { enforceTenantAuth } = require("../middlewares/enforcement.middleware");
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

router.use(enforceTenantAuth);

router.get("/next-code", getNextPurchaseCode);
router.get("/", getPurchases);
router.get("/number/:purchaseNumber", getPurchaseByNumber);
router.get("/:id", getPurchaseById);
router.post("/", createPurchase);
router.put("/:id", updatePurchase);
router.patch("/:id/status", updatePurchaseStatus);
router.post("/:id/receive", receivePurchase);
router.post("/:id/payment", recordPurchasePayment);
router.delete("/:id", deletePurchase);

module.exports = router;
