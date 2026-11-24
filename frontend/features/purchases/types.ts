export type PurchaseLineItem = {
  rowId: string;
  id?: string;
  itemIndex?: number;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  baseQuantity?: number;
  availableStock?: number;
  lowStock?: boolean;
  receivedQuantity?: number;
  receivedBaseQuantity?: number;
  unit: string;
  priceBasis?: "catalog" | "manual";
  basePrice?: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
};

export type PurchaseFinancials = {
  subtotal: number;
  discount: number;
  tax: number;
  freight: number;
  total: number;
};

export type CreatePurchaseStatus =
  | "Draft"
  | "Ordered"
  | "Partially Received"
  | "Received"
  | "Cancelled";


export type CreatePurchasePayload = {
  supplierId: string;
  purchaseDate: string;
  expectedDelivery: string;
  invoiceNumber: string;
  status: CreatePurchaseStatus;
  freight: number;
  notes: string;
  paymentAmount?: number;
  paymentMethod?: string;
  paymentReference?: string;
  items: Array<{
    id?: string;
    itemIndex?: number;
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    baseQuantity?: number;
    receivedQuantity?: number;
    receivedBaseQuantity?: number;
    unit: string;
    priceBasis?: "catalog" | "manual";
    basePrice?: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
  }>;
};

export type PurchaseReceipt = {
  quantity: number;
  receivedQuantity: number;
  reference: string;
  notes: string;
  receivedAt: string;
  performedBy: string;
};

export type PurchaseDto = {
  _id: string;
  purchaseNumber: string;
  supplier: {
    id: string;
    code: string;
    name: string;
    contact: string;
    phone: string;
    hub: string;
    address: string;
    ntn: string;
    paymentTerms: string;
    productIds: string[];
  };
  purchaseDate: string;
  expectedDelivery: string;
  invoiceNumber: string;
  items: Array<{
    id?: string;
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    baseQuantity?: number;
    availableStock: number;
    receivedQuantity: number;
    receivedBaseQuantity?: number;
    receipts: PurchaseReceipt[];
    unit: string;
    priceBasis?: "catalog" | "manual";
    basePrice?: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    lineTotal: number;
  }>;
  financials: PurchaseFinancials;
  paidAmount: number;
  payments: Array<{
    amount: number;
    method: string;
    reference: string;
    paidAt: string;
    createdBy: string;
  }>;
  status: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type PurchasePaymentInput = {
  amount: number;
  method: string;
  reference: string;
};

export type PurchaseReceiveInput = {
  reference: string;
  notes: string;
  performedBy?: string;
  items: Array<{
    itemId?: string;
    itemIndex?: number;
    receivedQuantity: number;
  }>;
};

export type PurchaseStatusUpdate =
  | "Draft"
  | "Ordered"
  | "Partially Received"
  | "Received"
  | "Cancelled";
