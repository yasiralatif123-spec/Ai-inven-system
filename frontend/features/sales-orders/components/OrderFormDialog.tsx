"use client";

import { useState, type FormEvent } from "react";
import type { Product } from "../../../app/products/types";
import {
  formatStockWithPieces,
  normalizeUnit,
  parseMoneyInput,
  priceForUnit,
  STOCK_UNITS,
  toBasePieces,
} from "../../../app/lib/units";
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
  basePrice?: number;
  priceBasis?: "catalog" | "manual";
};

function toEditableItems(items: DraftOrderItemInput[]): EditableItem[] {
  if (items.length === 0) {
    return [
      {
        name: "",
        sku: "",
        quantity: "1",
        unitLabel: "Piece",
        unitPrice: "0",
        priceBasis: "manual",
      },
    ];
  }
  return items.map((item) => ({
    name: item.name,
    sku: item.sku,
    quantity: String(item.quantity),
    unitLabel: item.unitLabel,
    unitPrice: String(item.unitPrice),
    basePrice: item.basePrice,
    priceBasis: item.priceBasis,
  }));
}

function emptyItem(): EditableItem {
  return {
    name: "",
    sku: "",
    quantity: "1",
    unitLabel: "Piece",
    unitPrice: "0",
    priceBasis: "manual",
  };
}

function canonicalSalePrice(product: Product): number {
  return parseMoneyInput(product.wholesalePrice) ?? 0;
}

function saleUnitPrice(product: Product, unit: string): number {
  return priceForUnit(canonicalSalePrice(product), unit) ?? 0;
}

const FIELD_LABEL_CLASS =
  "font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant";
const NEW_ITEM_INPUT_CLASS =
  "h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono-data text-mono-data text-on-surface outline-none transition duration-200 hover:border-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container";
const NEW_ITEM_TEXT_INPUT_CLASS =
  "h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface outline-none transition duration-200 hover:border-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container";

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
      const requestedPieces = toBasePieces(quantity, item.unitLabel);
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
      if (available !== null && Number.isFinite(requestedPieces) && requestedPieces > available) {
        validationIssues.push(
          `${label}: only ${formatStockWithPieces(available)} available for ${product?.title || "this product"} (${requestedPieces} pcs requested).`
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
    const unitLabel = normalizeUnit(product.uom) || "Piece";
    const basePrice = canonicalSalePrice(product);
    updateItem(index, {
      name: product.title,
      sku: product.sku,
      unitLabel,
      basePrice,
      priceBasis: "catalog",
      unitPrice: String(saleUnitPrice(product, unitLabel)),
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
      const product = productForItem(item);
      const unitLabel = normalizeUnit(item.unitLabel) || "Piece";
      return {
        name: item.name.trim(),
        sku: item.sku.trim(),
        quantity: Number(item.quantity),
        unitLabel,
        priceBasis: item.priceBasis ?? (product ? "catalog" : "manual"),
        basePrice:
          item.basePrice ?? (product ? canonicalSalePrice(product) : Number(item.unitPrice)),
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
    <div className="fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-on-surface/30 p-3 pt-6 backdrop-blur-[2px] sm:p-6 sm:pt-10">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-5xl rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel"
      >
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/80 bg-surface-container-lowest/95 px-4 py-4 backdrop-blur sm:px-5">
          <div className="min-w-0">
            <div className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
              {isEdit ? "Edit Sale Order" : "New Sale Order"}
            </div>
            <div className="mt-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
              {isEdit
                ? `#${orderNumber} · saved values loaded`
                : "Create a MongoDB-backed order in the live dispatch queue"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEdit ? "Close edit form" : "Close new order form"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant/70 bg-surface-container-lowest text-on-surface-variant transition duration-200 hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          >
            <span className="material-symbols-outlined text-[19px]">close</span>
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <section className="rounded-xl border border-outline-variant/70 bg-surface-container-low/60 p-4">
            <CustomerAutocomplete
              customer={customer}
              onCustomerIdChange={setCustomerId}
              phone={phone}
              location={location}
              onCustomerChange={setCustomer}
              onPhoneChange={setPhone}
              onLocationChange={setLocation}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
              <span className={FIELD_LABEL_CLASS}>Dispatch Hub</span>
              <select
                value={hub}
                onChange={(event) => setHub(event.target.value)}
                className={NEW_ITEM_TEXT_INPUT_CLASS}
              >
                {HUB_OPTIONS.filter((option) => option !== "All Dispatch Hubs").map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={FIELD_LABEL_CLASS}>Bay</span>
              <input
                value={bay}
                onChange={(event) => setBay(event.target.value)}
                className={NEW_ITEM_TEXT_INPUT_CLASS}
              />
            </label>
          </section>

          {isEdit ? null : (
            <section className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container-lowest shadow-panel">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/70 bg-surface-container-low px-4 py-3 sm:px-5">
                <span className={FIELD_LABEL_CLASS}>Order Items</span>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-medium text-body-medium text-primary transition duration-200 hover:border-outline hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
                >
                  <span className="material-symbols-outlined text-[17px]">add</span>
                  Add Item
                </button>
              </div>

              <div className="px-4 py-3 sm:px-5">
                <div className="hidden grid-cols-12 gap-3 border-b border-outline-variant/70 pb-2 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant lg:grid">
                  <span className="col-span-4">Product</span>
                  <span className="col-span-2">SKU</span>
                  <span className="col-span-1">Qty</span>
                  <span className="col-span-1">Unit</span>
                  <span className="col-span-2">Unit Price</span>
                  <span className="col-span-2 text-center">Remove</span>
                </div>

                <div className="divide-y divide-outline-variant/70">
                  {items.map((item, index) => {
                    const product = productForItem(item);
                    const itemTotal =
                      Math.max(Number(item.quantity) || 0, 0) *
                      Math.max(Number(item.unitPrice) || 0, 0);
                    return (
                      <div key={index} className="py-4 first:pt-1 last:pb-1">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-12">
                          <div className="col-span-2 min-w-0 sm:col-span-2 lg:col-span-4">
                            <span className={`${FIELD_LABEL_CLASS} mb-1.5 block lg:hidden`}>
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

                          <label className="col-span-2 min-w-0 sm:col-span-2 lg:col-span-2">
                            <span className={`${FIELD_LABEL_CLASS} mb-1.5 block lg:hidden`}>SKU</span>
                            <input
                              value={item.sku}
                              onChange={(event) => updateItem(index, { sku: event.target.value })}
                              placeholder="SKU (optional)"
                              aria-label={`Item ${index + 1} SKU`}
                              className={`${NEW_ITEM_INPUT_CLASS} placeholder:text-on-surface-variant/70`}
                            />
                          </label>

                          <label className="col-span-1 min-w-0 lg:col-span-1">
                            <span className={`${FIELD_LABEL_CLASS} mb-1.5 block lg:hidden`}>Qty</span>
                            <input
                              value={item.quantity}
                              onChange={(event) => updateItem(index, { quantity: event.target.value })}
                              type="number"
                              min="1"
                              step="1"
                              aria-label={`Item ${index + 1} quantity`}
                              className={NEW_ITEM_INPUT_CLASS}
                            />
                          </label>

                          <label className="col-span-1 min-w-0 lg:col-span-1">
                            <span className={`${FIELD_LABEL_CLASS} mb-1.5 block lg:hidden`}>Unit</span>
                            <select
                              value={normalizeUnit(item.unitLabel) || "Piece"}
                              onChange={(event) => {
                                const unitLabel = normalizeUnit(event.target.value) || "Piece";
                                updateItem(index, {
                                  unitLabel,
                                  ...(product && item.priceBasis !== "manual"
                                    ? { unitPrice: String(saleUnitPrice(product, unitLabel)) }
                                    : {}),
                                });
                              }}
                              aria-label={`Item ${index + 1} unit`}
                              className={NEW_ITEM_TEXT_INPUT_CLASS}
                            >
                              {STOCK_UNITS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="col-span-1 min-w-0 lg:col-span-2">
                            <span className={`${FIELD_LABEL_CLASS} mb-1.5 block lg:hidden`}>
                              Unit Price / {item.unitLabel}
                            </span>
                            <input
                              value={item.unitPrice}
                              onChange={(event) => updateItem(index, { unitPrice: event.target.value })}
                              type="number"
                              min="0"
                              step="1"
                              placeholder="Unit price"
                              aria-label={`Item ${index + 1} unit price`}
                              className={`${NEW_ITEM_INPUT_CLASS} placeholder:text-on-surface-variant/70`}
                            />
                          </label>

                          <div className="col-span-1 flex min-w-0 items-end justify-end lg:col-span-2">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              aria-label={`Remove item ${index + 1}`}
                              disabled={items.length === 1}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-error/20 bg-surface-container-lowest px-3 font-body-medium text-body-medium text-error transition duration-200 hover:bg-error-container/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete_outline</span>
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 py-2">
                          <div className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                            <span className="font-medium text-on-surface">Item {index + 1}</span>
                            {product ? (
                              <span>
                                {" · Available: "}
                                {formatStockWithPieces(Number(product.openingStock) || 0)}
                              </span>
                            ) : null}
                            <span>
                              {" · 1 "}
                              {item.unitLabel} = {toBasePieces(1, item.unitLabel)} pcs
                              {Number(item.quantity) > 0
                                ? ` · Equivalent: ${toBasePieces(Number(item.quantity) || 0, item.unitLabel)} pcs`
                                : ""}
                            </span>
                          </div>
                          <span
                            aria-live="polite"
                            className="font-mono-data-sm text-mono-data-sm text-on-surface-variant"
                          >
                            Item Total:{" "}
                            <span className="font-mono-data text-mono-data font-semibold tabular-nums text-primary">
                              {formatRs(itemTotal)}
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={FIELD_LABEL_CLASS}>Order Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as OrderStatus)}
                className={NEW_ITEM_TEXT_INPUT_CLASS}
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
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={FIELD_LABEL_CLASS}>Payment</span>
              <select
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
                className={NEW_ITEM_TEXT_INPUT_CLASS}
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={FIELD_LABEL_CLASS}>Method</span>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className={NEW_ITEM_TEXT_INPUT_CLASS}
              >
                {PAYMENT_METHODS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={FIELD_LABEL_CLASS}>Amount Received</span>
              <input
                type="number"
                min="0"
                step="1"
                value={amountReceived}
                onChange={(event) => setAmountReceived(event.target.value)}
                disabled={paymentStatus !== "partial"}
                className={`${NEW_ITEM_INPUT_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={FIELD_LABEL_CLASS}>Discount</span>
              <input
                type="number"
                min="0"
                step="1"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className={NEW_ITEM_INPUT_CLASS}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className={FIELD_LABEL_CLASS}>Freight</span>
              <input
                type="number"
                min="0"
                step="1"
                value={freight}
                onChange={(event) => setFreight(event.target.value)}
                className={NEW_ITEM_INPUT_CLASS}
              />
            </label>
          </section>

          <section className="grid grid-cols-1 divide-y divide-outline-variant/70 rounded-xl border border-outline-variant/70 bg-surface-container-low px-4 py-4 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="py-2 sm:py-0">
              <div className={FIELD_LABEL_CLASS}>Subtotal</div>
              <div className="mt-1 font-mono-data text-mono-data font-semibold tabular-nums text-on-surface">
                {formatRs(subtotal)}
              </div>
            </div>
            <div className="py-2 sm:py-0">
              <div className={FIELD_LABEL_CLASS}>Paid</div>
              <div className="mt-1 font-mono-data text-mono-data font-semibold tabular-nums text-primary">
                {formatRs(paid)}
              </div>
            </div>
            <div className="py-2 sm:py-0">
              <div className={FIELD_LABEL_CLASS}>Outstanding</div>
              <div className="mt-1 font-mono-data text-mono-data font-semibold tabular-nums text-error">
                {formatRs(outstanding)}
              </div>
            </div>
          </section>

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-error/20 bg-error-container/30 px-3 py-2.5 font-mono-data-sm text-mono-data-sm text-error"
            >
              {error}
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-outline-variant/80 bg-surface-container-lowest/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
          {validationIssues.length > 0 && !submitting ? (
            <div
              role="alert"
              className="rounded-lg border border-error/20 bg-error-container/30 px-3 py-2.5"
            >
              <div className="font-body-medium text-body-medium text-error">
                Before {isEdit ? "saving" : "creating"} the order:
              </div>
              <ul className="ml-4 mt-1 list-disc space-y-0.5 font-body-dense text-body-dense text-error">
                {validationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-outline hover:bg-surface-container active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary-container px-4 font-body-medium text-body-medium text-on-primary shadow-panel transition duration-200 hover:bg-primary active:translate-y-px active:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:cursor-not-allowed disabled:opacity-50"
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
