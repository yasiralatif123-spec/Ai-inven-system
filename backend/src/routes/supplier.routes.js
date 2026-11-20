const express = require("express");
const {
  getNextSupplierCode,
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplier.controller");

const router = express.Router();

router.get("/next-code", getNextSupplierCode);
router.get("/", getSuppliers);
router.get("/:id", getSupplierById);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

module.exports = router;
