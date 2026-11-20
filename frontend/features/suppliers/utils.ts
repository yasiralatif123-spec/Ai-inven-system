import type {
  Supplier,
  SupplierFilters,
  SupplierStatus,
  SupplierSummary,
} from "./types";

export function formatRs(value: number): string {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
}

export function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString("en-PK");
}

export function getSupplierSummary(suppliers: Supplier[]): SupplierSummary {
  const overdueSuppliers = suppliers.filter(
    (supplier) =>
      supplier.aging ||
      supplier.payableNote.toLowerCase().includes("due") ||
      supplier.payableNote.includes(">")
  );
  const now = new Date();

  return {
    total: suppliers.length,
    active: suppliers.filter((supplier) => supplier.status === "Active").length,
    onHold: suppliers.filter((supplier) => supplier.status === "On Hold").length,
    inactive: suppliers.filter((supplier) => supplier.status === "Inactive").length,
    newThisMonth: suppliers.filter((supplier) => {
      const created = new Date(supplier.createdAt);
      return (
        created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      );
    }).length,
    totalPayable: suppliers.reduce((sum, supplier) => sum + supplier.outstanding, 0),
    overdue: overdueSuppliers.length,
    overdueAmount: overdueSuppliers.reduce((sum, supplier) => sum + supplier.outstanding, 0),
  };
}

export function filterSuppliers(
  suppliers: Supplier[],
  filters: SupplierFilters
): Supplier[] {
  const term = filters.query.trim().toLowerCase();

  return suppliers.filter((supplier) => {
    if (
      term &&
      ![
        supplier.name,
        supplier.code,
        supplier.contact,
        supplier.hub,
        supplier.phone,
        supplier.email,
      ].some((value) => value.toLowerCase().includes(term))
    ) {
      return false;
    }

    if (filters.payable === "outstanding" && supplier.outstanding <= 0) return false;
    if (filters.payable === "clear" && supplier.outstanding > 0) return false;

    if (filters.status === "active" && supplier.status !== "Active") return false;
    if (filters.status === "hold" && supplier.status !== "On Hold") return false;
    if (filters.status === "inactive" && supplier.status !== "Inactive") return false;

    if (filters.region !== "all" && supplier.region !== filters.region) return false;

    return true;
  });
}

export function sortSuppliers(suppliers: Supplier[], sort: SupplierFilters["sort"]): Supplier[] {
  const sorted = [...suppliers];

  switch (sort) {
    case "payable-desc":
      return sorted.sort((a, b) => b.outstanding - a.outstanding);
    case "payable-asc":
      return sorted.sort((a, b) => a.outstanding - b.outstanding);
    case "purchases-desc":
      return sorted.sort((a, b) => b.totalPurchases - a.totalPurchases);
    case "date-desc":
      return sorted.sort((a, b) => b.lastPurchaseDate.localeCompare(a.lastPurchaseDate));
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export function getStatusClasses(status: SupplierStatus): string {
  switch (status) {
    case "Active":
      return "bg-primary/10 text-primary";
    case "On Hold":
      return "bg-tertiary-fixed text-on-tertiary-fixed-variant";
    case "Inactive":
      return "bg-surface-container-highest text-secondary";
  }
}

export function getRowClasses(supplier: Supplier, selected: boolean): string {
  const classes = ["hover:bg-surface-container-low transition-colors"];

  if (selected) {
    classes.unshift("bg-secondary-container/40 hover:bg-secondary-container/60");
  } else if (supplier.aging) {
    classes.unshift("bg-error-container/20");
  } else if (supplier.status === "On Hold") {
    classes.unshift("bg-tertiary-fixed/10");
  }

  if (supplier.status === "Inactive") classes.push("opacity-75");

  return classes.join(" ");
}

function escapeCsv(value: string | number): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function suppliersToCsv(suppliers: Supplier[]): string {
  const header = [
    "Code",
    "Supplier",
    "Contact",
    "Hub",
    "Region",
    "Phone",
    "Email",
    "Total Purchases",
    "Outstanding Payable",
    "Last Purchase",
    "Status",
  ];

  const rows = suppliers.map((supplier) => [
    `#${supplier.code}`,
    supplier.name,
    supplier.contact,
    supplier.hub,
    supplier.region,
    supplier.phone,
    supplier.email,
    supplier.totalPurchases,
    supplier.outstanding,
    supplier.lastPurchase,
    supplier.status,
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
