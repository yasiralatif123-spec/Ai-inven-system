const express = require("express");
const {
  getNextCustomerCode,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customer.controller");

const router = express.Router();

router.get("/next-code", getNextCustomerCode);
router.get("/", getCustomers);
router.get("/:id", getCustomerById);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

module.exports = router;
