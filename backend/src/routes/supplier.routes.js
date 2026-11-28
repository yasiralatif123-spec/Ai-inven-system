const express = require("express");
const { enforceTenantAuth } = require("../middlewares/enforcement.middleware");
const {
  getNextSupplierCode,
  getSuppliers,
  getSupplierById,
  getSupplierByCode,
  createSupplier,
  updateSupplier,
  recordSupplierOpeningBalancePayment,
  reverseSupplierOpeningBalancePayment,
  deleteSupplier,
} = require("../controllers/supplier.controller");

const router = express.Router();

router.use(enforceTenantAuth);

router.get("/next-code", getNextSupplierCode);
router.get("/", getSuppliers);
router.get("/code/:supplierCode", getSupplierByCode);
router.get("/:id", getSupplierById);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.post("/:id/opening-balance-payments", recordSupplierOpeningBalancePayment);
router.post("/:id/opening-balance-payments/:paymentId/reversal", reverseSupplierOpeningBalancePayment);
router.delete("/:id", deleteSupplier);

module.exports = router;
