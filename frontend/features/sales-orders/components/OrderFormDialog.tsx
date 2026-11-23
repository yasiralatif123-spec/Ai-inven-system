"use client";

import { useState, type FormEvent } from "react";
import type { Product } from "../../../app/products/types";
import { formatStockWithPieces, toBasePieces, STOCK_UNITS } from "../../../app/lib/units";
import {
  HUB_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_METHODS,
  PAYMENT_STATUS_OPTIONS,
} from "../constants";
import type {
  DraftOrderInput,
  DraftOrderItemInput,
  OrderStatus,
  PaymentStatus,
} from "../types";
import { useProductLookup } from "../hooks/useProductLookup";
import { formatRs } from "../utils";
import { CustomerAutocomplete } from "./CustomerAutocomplete";
import { ProductAutocomplete } from "./ProductAutocomplete";

type OrderFormDialogProps = {
  mode: "create" | "edit";
  initialValues: DraftOrderInput;
  orderNumber?: string;
  onClose: () => void;
  onSubmit: (input: DraftOrderInput) => Promise<void>;
};

type EditableItem = {
  name: string;
  sku: string;
  quantity: string;
  unitLabel: string;
  unitPrice: string;
};

function toEditableItems(items: DraftOrderItemInput[]): EditableItem[] {
  if (items.length === 0) {
    return [{ name: "", sku: "", quantity: "1", unitLabel: "Piece", unitPrice: "0" }];
  }
  return items.map((item) => ({
    name: item.name,
    sku: item.sku,
    quantity: String(item.quantity),
    unitLabel: item.unitLabel,
    unitPrice: String(item.unitPrice),
  }));
}

function emptyItem(): EditableItem {
  return { name: "", sku: "", quantity: "1", unitLabel: "Piece", unitPrice: "0" };
}

const NEW_ITEM_INPUT_CLASS =
  "h-8 w-full rounded border border-outline-variant bg-surface px-2 font-mono-data-sm text-mono-data-sm text-on-surface focus:border-primary focus:outline-none";
const NEW_ITEM_TEXT_INPUT_CLASS =
  "h-8 w-full rounded border border-outline-variant bg-surface px-2 font-body-default text-body-dense text-on-surface focus:border-primary focus:outline-none";

export function OrderFormDialog({
  mode,
  initialValues,
  orderNumber,
  onClose,
  onSubmit,
}: OrderFormDialogProps) {
  const isEdit = mode === "edit";
  const [customer, setCustomer] = useState(initialValues.customer);
  const [customerId, setCustomerId] = useState(initialValues.customerId || "");
  const [phone, setPhone] = useState(initialValues.phone);
  const [location, setLocation] = useState(initialValues.location);
  const [hub, setHub] = useState<string>(initialValues.hub);
  const [bay, setBay] = useState(initialValues.bay);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialValues.paymentStatus);
  const [paymentMethod, setPaymentMethod] = useState<string>(initialValues.paymentMethod);
  const [status, setStatus] = useState<OrderStatus>(initialValues.status);
  const [amountReceived, setAmountReceived] = useState(String(initialValues.amountReceived));
  const [discount, setDiscount] = useState(String(initialValues.discount));
  const [freight, setFreight] = useState(String(initialValues.freight));
  const [items, setItems] = useState<EditableItem[]>(toEditableItems(initialValues.items));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useProductLookup();

  const subtotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + Math.max(quantity, 0) * Math.max(unitPrice, 0);
  }, 0);
  const discountValue = Math.max(Number(discount) || 0, 0);
  const freightValue = Math.max(Number(freight) || 0, 0);
  const total = Math.max(subtotal - discountValue, 0) + freightValue;
  const receivedValue = Math.max(Number(amountReceived) || 0, 0);
  const paid = paymentStatus === "paid" ? total : paymentStatus === "partial" ? receivedValue : 0;
  const outstanding = Math.max(total - paid, 0);

  function productForItem(item: EditableItem) {
    const sku = item.sku.trim();
    return sku ? products.find((product) => product.sku === sku) || null : null;
  }

  const validationIssues: string[] = [];
  if (!customer.trim()) {
    validationIssues.push("Enter a customer / shop name.");
  }
  // Edit mode keeps items only to preserve the saved payload and financials.
  // They are not rendered there, so skip client-side checks the user cannot act on.
  if (!isEdit) {
    if (items.length === 0) {
      validationIssues.push("Add at least one order item.");
    }

    items.forEach((item, index) => {
      const label = `Item ${index + 1}`;
      const product = productForItem(item);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const available = product ? Number(product.openingStock) || 0 : null;

      if (!item.name.trim()) {
        validationIssues.push(`${label}: select a catalog product or type a product name.`);
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        validationIssues.push(`${label}: quantity must be greater than zero.`);
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        validationIssues.push(`${label}: unit price cannot be negative.`);
      }
      if (available !== null && Number.isFinite(quantity) && quantity > available) {
        validationIssues.push(
          `${label}: only ${available} unit${available === 1 ? "" : "s"} available for ${product?.title || "this product"}.`
        );
      }
    });
  }

  const hubValid = HUB_OPTIONS.includes(hub as (typeof HUB_OPTIONS)[number]) || hub.trim().length > 0;
  if (!hubValid) {
    validationIssues.push("Select a dispatch hub.");
  }
  if (total <= 0) {
    validationIssues.push("Order total must be greater than zero — check item prices.");
  }
  if (paid > total) {
    validationIssues.push("Amount received cannot exceed the order total.");
  }
  if (paymentStatus === "partial" && paid <= 0) {
    validationIssues.push("Enter the amount received for partial payments.");
  }

  const canSubmit = validationIssues.length === 0;

  function updateItem(index: number, patch: Partial<EditableItem>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  }

  function selectProduct(index: number, product: Product) {
    const normalizedUom = (product.uom || "").trim();
    const unitLabel = ["Carton", "Box", "Piece"].includes(normalizedUom) ? normalizedUom : "Piece";
    updateItem(index, {
      name: product.title,
      sku: product.sku,
      unitLabel,
      unitPrice: String(Number(product.wholesalePrice) || 0),
    });
  }

  function applyExactProductMatch(index: number, value: string) {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return;

    const exact = products.find(
      (product) =>
        product.title.trim().toLowerCase() === normalized ||
        product.sku.trim().toLowerCase() === normalized
    );
    if (exact) selectProduct(index, exact);
  }

  function addItem() {
    setItems((current) => [...current, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!canSubmit) {
      setError(validationIssues[0] ?? "Please complete the highlighted fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payloadItems: DraftOrderItemInput[] = items.map((item) => {
      const product = productForItem(item);      return {
        name: item.name.trim(),
        sku: item.sku.trim(),        quantity: Number(item.quantity),
        unitLabel: item.unitLabel.trim() || "Piece",
        basePrice: product ? Number(product.wholesalePrice) || 0 : Number(item.unitPrice),
        unitPrice: Number(item.unitPrice),
      };
    });

    try {
      await onSubmit({
        customerId: customerId || undefined,
        customer: customer.trim(),
        phone: phone.trim(),
        location: location.trim() || hub,
        hub,
        bay: bay.trim() || "Counter",
        paymentStatus,
        paymentMethod,
        status,
        amountReceived: receivedValue,
        discount: discountValue,
        freight: freightValue,
        items: payloadItems,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : `Failed to ${isEdit ? "update" : "create"} sale order. Please try again.`
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-12">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl rounded border border-outline-variant bg-surface-container-lowest shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-high/40 px-4 py-3">
          <div>
            <div className="font-headline-md text-headline-md text-on-surface">
              {isEdit ? "Edit Sale Order" : "New Sale Order"}
            </div>
            <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-secondary">
              {isEdit
                ? `#${orderNumber} · saved values loaded`
                : "Create a MongoDB-backed order in the live dispatch queue"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEdit ? "Close edit form" : "Close new order form"}
            className="flex h-7 w-7 items-center justify-center rounded text-secondary transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-4 p-4">
          <CustomerAutocomplete
            customer={customer}
            onCustomerIdChange={setCustomerId}
            phone={phone}
            location={location}
            onCustomerChange={setCustomer}
            onPhoneChange={setPhone}
            onLocationChange={setLocation}
          />

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps uppercase text-secondary">Dispatch Hub</span>
              <select
                value={hub}
                onChange={(event) => setHub(event.target.value)}
                className="h-9 rounded border border-outline-variant bg-surface px-2.5 font-body-default text-body-default text-on-surface focus:border-primary focus:outline-none"
              >
                {HUB_OPTIONS.filter((option) => option !== "All Dispatch Hubs").map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps uppercase text-secondary">Bay</span>
              <input
                value={bay}
                onChange={(event) => setBay(event.target.value)}
                className="h-9 rounded border border-outline-variant bg-surface px-2.5 font-body-default text-body-default text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
          </section>

          {isEdit ? null : (
            <section className="rounded border border-outline-variant bg-surface-container-low p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-label-caps text-label-caps uppercase text-secondary">Order Items</span>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex h-7 items-center gap-1 rounded border border-outline-variant bg-surface px-2 font-body-default text-body-dense text-primary transition-colors hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add Item
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => {
                  const product = productForItem(item);                  const itemTotal =
                    Math.max(Number(item.quantity) || 0, 0) *
                    Math.max(Number(item.unitPrice) || 0, 0);
                  return (
                    <div key={index} className="rounded border border-outline-variant bg-surface p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-mono-data-sm text-mono-data-sm text-secondary">
                          Item {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          aria-label={`Remove item ${index + 1}`}
                          disabled={items.length === 1}
                          className="inline-flex h-7 items-center gap-1 rounded border border-outline-variant bg-surface px-2 font-body-default text-body-dense text-error transition-colors hover:bg-error-container/30 disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete_outline</span>
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-12">
                        <div className="col-span-2 min-w-0 sm:col-span-4">
                          <span className="mb-1 block font-label-caps text-label-caps uppercase text-secondary">
                            Product
                          </span>
                          <ProductAutocomplete
                            value={item.name}
                            onChange={(value) => updateItem(index, { name: value })}
                            onProductSelect={(selected) => selectProduct(index, selected)}
                            onCommit={(value) => applyExactProductMatch(index, value)}
                            products={products}
                            loading={productsLoading}
                            error={productsError}
                            ariaLabel={`Item ${index + 1} name`}
                          />
                        </div>

                        <label className="col-span-2 min-w-0 sm:col-span-3">
                          <span className="mb-1 block font-label-caps text-label-caps uppercase text-secondary">
                            SKU
                          </span>
                          <input
                            value={item.sku}
                            onChange={(event) => updateItem(index, { sku: event.target.value })}
                            placeholder="SKU (optional)"
                            aria-label={`Item ${index + 1} SKU`}
                            className={`${NEW_ITEM_INPUT_CLASS} placeholder:text-outline`}
                          />
                        </label>

                        <label className="col-span-1 min-w-0 sm:col-span-2">
                          <span className="mb-1 block font-label-caps text-label-caps uppercase text-secondary">
                            Qty
                          </span>
                          <input
                            value={item.quantity}
                            onChange={(event) => {
                              const quantity = event.target.value;
                              const product = productForItem(item);
                              updateItem(index, {
                                quantity,
                                ...(product
                                  ? {
                                      unitPrice: String(Number(product.wholesalePrice)||0),
                                    }
                                  : {}),
                              });
                            }}
                            type="number"
                            min="1"
                            step="1"
                            aria-label={`Item ${index + 1} quantity`}
                            className={NEW_ITEM_INPUT_CLASS}
                          />
                        </label>

                        <label className="col-span-1 min-w-0 sm:col-span-1">
                          <span className="mb-1 block font-label-caps text-label-caps uppercase text-secondary">
                            Unit
                          </span>
                          <select
                            value={["Carton", "Box", "Piece"].includes(item.unitLabel) ? item.unitLabel : "Piece"}
                            onChange={(event) => updateItem(index, { unitLabel: event.target.value })}
                            aria-label={`Item ${index + 1} unit`}
                            className={NEW_ITEM_TEXT_INPUT_CLASS}
                          >
                            {STOCK_UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </label>

                        <label className="col-span-2 min-w-0 sm:col-span-2">
                          <span className="mb-1 block font-label-caps text-label-caps uppercase text-secondary">
                            Unit Price
                          </span>
                          <input
                            value={item.unitPrice}
                            onChange={(event) => updateItem(index, { unitPrice: event.target.value })}
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Unit price"
                            aria-label={`Item ${index + 1} unit price`}
                            className={`${NEW_ITEM_INPUT_CLASS} placeholder:text-outline`}
                          />
                        </label>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-outline-variant/70 pt-2">
                        <div className="font-mono-data-sm text-mono-data-sm text-secondary">
                          {product ? (
                            <span>Available: {formatStockWithPieces(Number(product.openingStock) || 0)}</span>
                          ) : null}
                          <span className={product ? "ml-2" : ""}>
                            1 {item.unitLabel} = {toBasePieces(1, item.unitLabel)} pcs
                            {Number(item.quantity) > 0
                              ? ` · Equivalent: ${toBasePieces(Number(item.quantity) || 0, item.unitLabel)} pcs`
                              : ""}
                          </span>
                        </div>
                        <span
                          aria-live="polite"
                          className="ml-auto font-mono-data-sm text-mono-data-sm text-secondary"
                        >
                          Item Total:{" "}
                          <span className="font-semibold tabular-nums text-primary">
                            {formatRs(itemTotal)}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps uppercase text-secondary">Order Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as OrderStatus)}
                className="h-9 rounded border border-outline-variant bg-surface px-2.5 font-body-default text-body-dense text-on-surface focus:border-primary focus:outline-none"
              >
                {status === "Delivered" ? (
                  <option value="Delivered" disabled>
                    Delivered (archived)
                  </option>
                ) : null}
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps uppercase text-secondary">Payment</span>
              <select
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
                className="h-9 rounded border border-outline-variant bg-surface px-2.5 font-body-default text-body-dense text-on-surface focus:border-primary focus:outline-none"
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps uppercase text-secondary">Method</span>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="h-9 rounded border border-outline-variant bg-surface px-2.5 font-body-default text-body-dense text-on-surface focus:border-primary focus:outline-none"
              >
                {PAYMENT_METHODS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps uppercase text-secondary">Amount Received</span>
              <input
                type="number"
                min="0"
                step="1"
                value={amountReceived}
                onChange={(event) => setAmountReceived(event.target.value)}
                disabled={paymentStatus !== "partial"}
                className="h-9 rounded border border-outline-variant bg-surface px-2.5 font-mono-data-sm text-mono-data-sm text-on-surface focus:border-primary focus:outline-none disabled:opacity-50"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps uppercase text-secondary">Discount</span>
              <input
                type="number"
                min="0"
                step="1"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className="h-9 rounded border border-outline-variant bg-surface px-2.5 font-mono-data-sm text-mono-data-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps uppercase text-secondary">Freight</span>
              <input
                type="number"
                min="0"
                step="1"
                value={freight}
                onChange={(event) => setFreight(event.target.value)}
                className="h-9 rounded border border-outline-variant bg-surface px-2.5 font-mono-data-sm text-mono-data-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
          </section>

          <section className="grid grid-cols-3 divide-x divide-outline-variant rounded border border-outline-variant bg-surface-container-low py-2 text-center">
            <div>
              <div className="font-label-caps text-[10px] uppercase text-secondary">Subtotal</div>
              <div className="font-mono-data-sm text-mono-data-sm tabular-nums text-on-surface">
                {formatRs(subtotal)}
              </div>
            </div>
            <div>
              <div className="font-label-caps text-[10px] uppercase text-secondary">Paid</div>
              <div className="font-mono-data-sm text-mono-data-sm tabular-nums text-primary">
                {formatRs(paid)}
              </div>
            </div>
            <div>
              <div className="font-label-caps text-[10px] uppercase text-secondary">Outstanding</div>
              <div className="font-mono-data-sm text-mono-data-sm tabular-nums text-error">
                {formatRs(outstanding)}
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded border border-error-container bg-error-container/40 px-3 py-2 font-mono-data-sm text-mono-data-sm text-error">
              {error}
            </div>
          ) : null}
        </div>

        <div className="border-t border-outline-variant bg-surface-container-high/40 px-4 py-3">
          {validationIssues.length > 0 && !submitting ? (
            <div
              role="alert"
              className="mb-3 rounded border border-error-container bg-error-container/30 px-3 py-2"
            >
              <div className="font-body-medium text-body-dense text-error">
                Before {isEdit ? "saving" : "creating"} the order:
              </div>
              <ul className="ml-4 mt-1 list-disc space-y-0.5 font-body-dense text-body-dense text-error">
                {validationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded border border-outline-variant bg-surface px-3 font-body-medium text-body-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-8 rounded bg-primary-container px-3.5 font-body-medium text-body-medium text-on-primary transition-colors hover:bg-primary disabled:opacity-50"
            >
              {submitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Create Sale Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
