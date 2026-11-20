export type PurchaseStatus =
  | "Draft"
  | "Ordered"
  | "Partially Received"
  | "Received"
  | "Cancelled";

export type PurchaseDelivery = {
  gateInward: string;
  receivedQuantity: number;
  orderedQuantity: number;
  audit: string;
  inspector: string;
  grnSigned: string;
};

export type PurchaseLine = {
  name: string;
  sku: string;
  flavors: string[];
  quantity: number;
  receivedQuantity: number;
  basePrice: number;
  flavorCount: number;
  unitPrice: number;
  lineTotal: number;
  unit: string;
  date: string;
  status: PurchaseStatus;
  purchaseId: string;
};

export type Purchase = {
  id: string;
  date: string;
  items: string;
  lines: PurchaseLine[];
  reference: string;
  total: number;
  paid: number;
  remaining: number;
  status: PurchaseStatus;
  orderedQuantity: number;
  receivedQuantity: number;
  delivery?: PurchaseDelivery;
};

export type TimelineTone = "amber" | "primary" | "secondary";

export type TimelineEntry = {
  id: string;
  title: string;
  date: string;
  detail: string;
  tone: TimelineTone;
};

export type MasterProfileRow = {
  label: string;
  value: string;
  sub?: string;
  subSecondary?: string;
  stacked?: boolean;
};

export type SupplierFinancials = {
  totalPurchased: number;
  purchaseOrders: number;
  amountPaid: number;
  termsLabel: string;
  remainingPayable: number;
  dueDate: string;
  overdueNote: string;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  lastPaymentVoucher: string;
};

export type SupplierPaymentRow = {
  id: string;
  title: string;
  detail: string;
  date: string;
  amount: number;
  method: string;
  reference: string;
};

export type SupplierInvoiceRow = {
  id: string;
  date: string;
  reference: string;
  total: number;
  status: PurchaseStatus;
};

export type SupplierProfileHeader = {
  name: string;
  status: string;
  vendorCode: string;
  contact: string;
  contactRole: string;
  phone: string;
  email: string;
  location: string;
};

export type SupplierProfile = {
  header: SupplierProfileHeader;
  financials: SupplierFinancials;
  purchases: Purchase[];
  payments: SupplierPaymentRow[];
  invoices: SupplierInvoiceRow[];
  masterProfile: MasterProfileRow[];
  timeline: TimelineEntry[];
};
