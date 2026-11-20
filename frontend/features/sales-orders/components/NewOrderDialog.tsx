"use client";

import type { DraftOrderInput } from "../types";
import { createEmptyDraftOrder } from "../utils";
import { OrderFormDialog } from "./OrderFormDialog";

type NewOrderDialogProps = {
  onClose: () => void;
  onSubmit: (input: DraftOrderInput) => Promise<void>;
  initialCustomer?: {
    name: string;
    phone: string;
    location: string;
  };
};

export function NewOrderDialog({ onClose, onSubmit, initialCustomer }: NewOrderDialogProps) {
  const initialValues = createEmptyDraftOrder();

  if (initialCustomer) {
    initialValues.customer = initialCustomer.name;
    initialValues.phone = initialCustomer.phone;
    initialValues.location = initialCustomer.location || initialCustomer.name;
  }

  return (
    <OrderFormDialog
      mode="create"
      initialValues={initialValues}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
