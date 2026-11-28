export const PRODUCT_CATEGORIES = [
  "Cooking Oil & Ghee",
  "Spices & Staples",
  "Beverages",
  "Tea & Hot Drinks",
  "Snacks & Confectionery",
  "Personal Care",
] as const;

export const STOCK_UNITS = ["Carton", "Box", "Piece"] as const;

export const WAREHOUSES = [
  "Lahore Central Warehouse (Depot 01 - Kot Lakhpat)",
  "Multan Industrial Hub Depot (Depot 02)",
  "Faisalabad Transit Facility (Depot 03)",
  "Karachi Port Bonded Terminal (Depot 04)",
] as const;

export const CATALOG_STATUSES = [
  { value: "active", label: "Active", description: "Available for immediate sales" },
  { value: "draft", label: "Draft", description: "Hidden from sales terminals" },
  { value: "discontinued", label: "Discontinued", description: "Prevent future reorders" },
] as const;
