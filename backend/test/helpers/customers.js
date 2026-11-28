const Customer = require("../../src/models/Customer");

function customerSeed(overrides = {}) {
  const suffix = Math.random().toString(36).slice(2, 10).toUpperCase();
  return {
    ledgerCode: `TEST-CUST-${suffix}`,
    name: "Test Customer",
    businessName: `Test Customer Traders ${suffix}`,
    phone: `+92 300${Math.floor(1000000 + Math.random() * 9000000)}`,
    city: "Lahore",
    address: "Test Address",
    customerType: "Wholesale",
    status: "Active",
    route: "unassigned",
    creditLimit: 1000000,
    paymentTerms: "cod",
    openingBalance: 0,
    ...overrides,
  };
}

async function seedCustomer(overrides = {}) {
  return Customer.create(customerSeed(overrides));
}

module.exports = { customerSeed, seedCustomer };
