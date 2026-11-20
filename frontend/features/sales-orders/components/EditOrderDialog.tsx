"use client";

import type { DraftOrderInput, SalesOrder } from "../types";
import { draftOrderFromSalesOrder } from "../utils";
import { OrderFormDialog } from "./OrderFormDialog";

type EditOrderDialogProps = {
  order: SalesOrder;
  onClose: () => void;
  onSubmit: (input: DraftOrderInput) => Promise<void>;
};

export function EditOrderDialog({ order, onClose, onSubmit }: EditOrderDialogProps) {
  return (
    <OrderFormDialog
      mode="edit"
      orderNumber={order.id}
      initialValues={draftOrderFromSalesOrder(order)}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
