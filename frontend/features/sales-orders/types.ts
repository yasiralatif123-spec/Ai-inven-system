export type OrderStatus =
  | "Pending Approval"
  | "Processing"
  | "Packed"
  | "Dispatched"
  | "Delivered"
  | "Credit Hold";

export type PaymentStatus = "paid" | "partial" | "unpaid";

export type DateGroup = "today" | "yesterday" | "older";

export type OrderItem = {
  name: string;
  sku: string;
  productId?: string | null;
  flavor?: string;
  stockDeducted?: boolean;
  quantity: number;
  unitLabel: string;
  unitPrice: number;
  available: number;
  lineTotal: number;
};

export type OrderFinancials = {
  subtotal: number;
  discount: number;
  tax: number;
  freight: number;
  total: number;
  paid: number;
  outstanding: number;
  dueDate: string;
};

export type SalesOrder = {
  id: string;
  time: string;
  dateGroup: DateGroup;
  customer: string;
  location: string;
  phone: string;
  hub: string;
  skuCount: number;
  unitCount: number;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentLabel: string;
  paymentMethod: string;
  status: OrderStatus;
  createdBy: string;
  createdAt: string;
  bay: string;
  items: OrderItem[];
  financials: OrderFinancials;
};

export type StatusFilter = "All Orders" | OrderStatus;
export type StatusTab = "All Orders" | Exclude<OrderStatus, "Packed">;
export type PaymentFilter = "all" | PaymentStatus;
export type DateFilter = "all" | DateGroup;
export type HubFilter = "all" | string;

export type DraftOrderItemInput = {
  name: string;
  sku: string;
  flavor?: string;
  quantity: number;
  unitLabel: string;
  unitPrice: number;
};

export type DraftOrderInput = {
  customer: string;
  phone: string;
  location: string;
  hub: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  status: OrderStatus;
  amountReceived: number;
  discount: number;
  freight: number;
  bay: string;
  items: DraftOrderItemInput[];
};

export type PaymentInput = {
  amount: number;
  method: string;
};

export type SaleOrderDto = {
  _id: string;
  orderNumber: string;
  customer: { name: string; phone: string; location: string };
  hub: string;
  paymentStatus: PaymentStatus;
  paymentLabel: string;
  paymentMethod: string;
  status: OrderStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  bay: string;
  items: OrderItem[];
  skuCount: number;
  unitCount: number;
  amount: number;
  financials: OrderFinancials;
};
