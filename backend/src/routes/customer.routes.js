const express = require("express");
const { enforceTenantAuth } = require("../middlewares/enforcement.middleware");
const {
  getNextCustomerCode,
  getCustomers,
  getCustomerById,
  getCustomerByCode,
  createCustomer,
  updateCustomer,
  recordCustomerOpeningBalancePayment,
  reverseCustomerOpeningBalancePayment,
  deleteCustomer,
} = require("../controllers/customer.controller");

const router = express.Router();

router.use(enforceTenantAuth);

router.get("/next-code", getNextCustomerCode);
router.get("/", getCustomers);
router.get("/code/:ledgerCode", getCustomerByCode);
router.get("/:id", getCustomerById);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.post("/:id/opening-balance-payments", recordCustomerOpeningBalancePayment);
router.post("/:id/opening-balance-payments/:paymentId/reversal", reverseCustomerOpeningBalancePayment);
router.delete("/:id", deleteCustomer);

module.exports = router;
