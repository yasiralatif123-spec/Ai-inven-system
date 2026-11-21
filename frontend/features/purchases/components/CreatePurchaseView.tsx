"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toFlavorArray } from "../../../app/lib/flavors";
import type { Product } from "../../../app/products/types";
import type { Supplier } from "../../suppliers/types";
import { DEFAULT_TAX_RATE } from "../constants";
import { usePurchaseLookups } from "../hooks/usePurchaseLookups";
import {
  createPurchase,
  fetchNextPurchaseCode,
  fetchPurchase,
  recordPurchasePayment,
  updatePurchase,
} from "../services/purchase.service";
import type { CreatePurchaseStatus, PurchaseDto, PurchaseLineItem } from "../types";
import {
  addDays,
  calculatePurchaseTotals,
  flavorAdjustedPurchasePrice,
  formatRs,
  purchaseBasePrice,
  purchaseSupplierToSupplier,
  taxRateFromBracket,
  toIsoDate,
} from "../utils";
import { CreatePurchaseHeader } from "./CreatePurchaseHeader";
import { PurchaseContextCard } from "./PurchaseContextCard";
import { PurchaseItemsTable } from "./PurchaseItemsTable";
import { PurchasePreviewDialog } from "./PurchasePreviewDialog";
import { PurchaseSummaryCard } from "./PurchaseSummaryCard";

const DEFAULT_NOTES =
  "Deliver to Karachi Central Warehouse (Gate 3 - Godown A). Confirm bilty receipt upon unloading.";

let nextRowId = 0;

function createRow(): PurchaseLineItem {
  nextRowId += 1;
  return {
    rowId: `line-${nextRowId}`,
    productId: "",
    name: "",
    sku: "",
    flavor: [],
    quantity: 0,
    unit: "Carton",
    basePrice: 0,
    flavorCount: 1,
    unitPrice: 0,
    discount: 0,
    taxRate: DEFAULT_TAX_RATE,
  };
}

function availableStock(product: Product): number {
  return Math.max(Number(product.openingStock) || 0, 0);
}

function defaultFlavorsFor(product: Product, supplier: Supplier | null): string[] {
  const saved = toFlavorArray(supplier?.productFlavors?.[product._id]);
  if (saved.length === 0 || !product.flavors?.length) return [];
  return saved.filter((flavor) =>
    product.flavors?.some((option) => option.toLowerCase() === flavor.toLowerCase())
  );
}

function sameFlavorMap(
  left: Record<string, string[]> | undefined,
  right: Record<string, string[]> | undefined
): boolean {
  const a = left || {};
  const b = right || {};
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(b, key) &&
        toFlavorArray(a[key]).join("\u0000") === toFlavorArray(b[key]).join("\u0000")
    )
  );
}

function supplierLabel(supplier: Supplier): string {
  return `${supplier.name} (#${supplier.code})`;
}

export function CreatePurchaseView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const supplierIdParam = searchParams.get("supplierId");
  const productIdParam = searchParams.get("product");
  const flavorParam = searchParams.get("flavor");
  const stockParam = searchParams.get("stock");
  const lowStockParam = searchParams.get("lowStock");
  const { suppliers, products, suppliersLoading, productsLoading, error: lookupError } =
    usePurchaseLookups();

  const [purchaseCode, setPurchaseCode] = useState("PO-2042");
  const [supplierQuery, setSupplierQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [status, setStatus] = useState<CreatePurchaseStatus>("Draft");
  const [items, setItems] = useState<PurchaseLineItem[]>(() => [createRow()]);
  const [freight, setFreight] = useState(0);
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseDto | null>(null);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const supplierPreselectedRef = useRef(false);
  const lowStockPrefillRef = useRef(false);

  useEffect(() => {
    if (editId) return;

    supplierPreselectedRef.current = false;
    lowStockPrefillRef.current = false;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const today = toIsoDate(new Date());

      setPurchaseCode("PO-2042");
      setSupplierQuery("");
      setSelectedSupplier(null);
      setPurchaseDate(today);
      setExpectedDelivery(addDays(today, 3));
      setInvoiceNumber("");
      setStatus("Draft");
      setItems([createRow()]);
      setFreight(0);
      setNotes(DEFAULT_NOTES);
      setPaymentAmount(0);
      setPaymentMethod("Cash");
      setSaving(false);
      setError(null);
      setNotice(null);
      setPreviewOpen(false);
      setEditingPurchase(null);
      setLoadingPurchase(false);

      fetchNextPurchaseCode()
        .then((code) => {
          if (!cancelled) setPurchaseCode(code);
        })
        .catch(() => {
          // Keep the design default when the API is unavailable.
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [editId]);

  useEffect(() => {
    if (editId || supplierPreselectedRef.current || suppliers.length === 0 || selectedSupplier) return;

    if (!supplierIdParam) return;

    const target = suppliers.find((supplier) => supplier.id === supplierIdParam);
    if (!target) return;

    const timer = window.setTimeout(() => {
      supplierPreselectedRef.current = true;
      setSelectedSupplier(target);
      setSupplierQuery(supplierLabel(target));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [editId, selectedSupplier, supplierIdParam, suppliers]);

  useEffect(() => {
    if (!editId) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSaving(false);
      setError(null);
      setNotice(null);
      setPreviewOpen(false);
      setEditingPurchase(null);
      setPaymentAmount(0);
      setPaymentMethod("Cash");
      setLoadingPurchase(true);
      try {
        const purchase = await fetchPurchase(editId);
        if (cancelled) return;

        setEditingPurchase(purchase);
        setPurchaseCode(purchase.purchaseNumber);
        setSupplierQuery(
          `${purchase.supplier.name} (#${purchase.supplier.code})`.trim()
        );
        setSelectedSupplier(purchaseSupplierToSupplier(purchase));
        setPurchaseDate(toIsoDate(purchase.purchaseDate));
        setExpectedDelivery(toIsoDate(purchase.expectedDelivery));
        setInvoiceNumber(purchase.invoiceNumber || "");
        setStatus(purchase.status as CreatePurchaseStatus);
        setFreight(Number(purchase.financials?.freight) || 0);
        setNotes(purchase.notes || "");
        setPaymentAmount(0);
        setPaymentMethod("Cash");
        setItems(
          purchase.items.map((item, index) => {
            nextRowId += 1;
            return {
              rowId: `line-${nextRowId}`,
              id: item.id,
              itemIndex: index,
              productId: item.productId || "",
              name: item.name,
              sku: item.sku || "",
              flavor: toFlavorArray(item.flavor),
              quantity: item.quantity,
              availableStock: Number(item.availableStock) || 0,
              receivedQuantity: Number(item.receivedQuantity) || 0,
              unit: item.unit,
              basePrice: item.basePrice,
              flavorCount: item.flavorCount,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              taxRate: item.taxRate,
            };
          })
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load the purchase for editing."
          );
        }
      } finally {
        if (!cancelled) setLoadingPurchase(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [editId]);

  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => {
      setNotice(null);
      setError(null);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [notice, error]);

  const totals = useMemo(() => calculatePurchaseTotals(items, freight), [freight, items]);
  const paidAmount = editingPurchase ? Number(editingPurchase.paidAmount) || 0 : 0;
  const remainingAmount = Math.max(totals.total - paidAmount, 0);

  // Saved purchases carry a supplier snapshot. Use the live supplier's flavor
  // defaults when it is available, without writing derived state back to state.
  const activeSupplier = useMemo(() => {
    if (!selectedSupplier?.id) return selectedSupplier;
    const current = suppliers.find((supplier) => supplier.id === selectedSupplier.id);
    if (!current || sameFlavorMap(current.productFlavors, selectedSupplier.productFlavors)) {
      return selectedSupplier;
    }
    return { ...selectedSupplier, productFlavors: { ...current.productFlavors } };
  }, [selectedSupplier, suppliers]);

  // Arriving from a dashboard low-stock alert preloads that product and its
  // linked supplier into the form. Unit price stays at 0 in the form; totals
  // and the saved record still use the authoritative product purchase price.
  useEffect(() => {
    if (editId || !productIdParam || lowStockPrefillRef.current || products.length === 0) return;

    const product = products.find((candidate) => candidate._id === productIdParam);
    if (!product) return;

    const flavors = flavorParam ? [flavorParam] : defaultFlavorsFor(product, activeSupplier);
    const parsedStock = Number(stockParam);
    const stock =
      stockParam !== null && Number.isFinite(parsedStock)
        ? Math.max(parsedStock, 0)
        : availableStock(product);

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || lowStockPrefillRef.current) return;
      lowStockPrefillRef.current = true;

      setItems((current) => {
        const first = current[0] ?? createRow();
        const prefilled: PurchaseLineItem = {
          ...first,
          productId: product._id,
          name: product.title,
          sku: product.sku,
          flavor: flavors,
          quantity: first.quantity || 0,
          availableStock: stock,
          lowStock: lowStockParam === "1",
          basePrice: purchaseBasePrice(product),
          flavorCount: (product.flavors?.length || 0) > 0 ? flavors.length : 1,
          unitPrice: 0,
          unit: product.uom || "Carton",
          taxRate: taxRateFromBracket(product.taxBracket),
        };
        return [prefilled, ...current.slice(1)];
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    editId,
    productIdParam,
    flavorParam,
    stockParam,
    lowStockParam,
    products,
    suppliers,
    supplierIdParam,
    selectedSupplier,
    activeSupplier,
  ]);

  const availableProducts = useMemo(() => {
    if (!activeSupplier) return [];
    const linkedIds = new Set(activeSupplier.productIds || []);
    return products.filter((product) => linkedIds.has(product._id));
  }, [products, activeSupplier]);

  const emptyProductsMessage = suppliersLoading
    ? "Loading suppliers…"
    : suppliers.length === 0
      ? "No suppliers have been created yet."
      : !activeSupplier
        ? "Select a supplier to see products."
        : "No products available for this supplier";

  const unitsLabel = useMemo(() => {
    const totalQuantity = items.reduce((sum, item) => sum + Math.max(item.quantity || 0, 0), 0);
    const cartonQuantity = items
      .filter((item) => item.unit.toLowerCase() === "carton")
      .reduce((sum, item) => sum + Math.max(item.quantity || 0, 0), 0);
    return cartonQuantity > 0
      ? `Cartons Total: ${cartonQuantity} cartons`
      : `Units Total: ${totalQuantity} units`;
  }, [items]);

  function updateItem(rowId: string, patch: Partial<PurchaseLineItem>) {
    setItems((current) =>
      current.map((item) => {
        if (item.rowId !== rowId) return item;
        const next = { ...item, ...patch };
        const shouldRecalculate =
          Object.prototype.hasOwnProperty.call(patch, "flavor") ||
          Object.prototype.hasOwnProperty.call(patch, "quantity");
        if (!shouldRecalculate || !next.productId) return next;

        const product = products.find((candidate) => candidate._id === next.productId);
        if (!product) return next;
        const flavors = toFlavorArray(next.flavor);

        return {
          ...next,
          basePrice: purchaseBasePrice(product),
          flavorCount: (product.flavors?.length || 0) > 0 ? flavors.length : 1,
          unitPrice: next.lowStock ? 0 : flavorAdjustedPurchasePrice(product, flavors),
        };
      })
    );
  }

  function addProductRow(product?: Product) {
    const row = createRow();
    if (product) {
      const flavors = defaultFlavorsFor(product, activeSupplier);
      row.productId = product._id;
      row.name = product.title;
      row.sku = product.sku;
      row.flavor = flavors;
      row.availableStock = availableStock(product);
      row.quantity = 0;
      row.basePrice = purchaseBasePrice(product);
      row.flavorCount = (product.flavors?.length || 0) > 0 ? flavors.length : 1;
      row.unitPrice = flavorAdjustedPurchasePrice(product, flavors);
      row.unit = product.uom || "Carton";
      row.taxRate = taxRateFromBracket(product.taxBracket);
    }
    setItems((current) => [...current, row]);
  }

  function handleProductSelect(rowId: string, product: Product) {
    updateItem(rowId, {
      productId: product._id,
      name: product.title,
      sku: product.sku,
      flavor: defaultFlavorsFor(product, activeSupplier),
      availableStock: availableStock(product),
      quantity: 0,
      lowStock: false,
      basePrice: purchaseBasePrice(product),
      unit: product.uom || "Carton",
      taxRate: taxRateFromBracket(product.taxBracket),
    });
  }

  function handleBarcodeScan(code: string) {
    if (!selectedSupplier) {
      setError("Select a supplier before scanning products.");
      return;
    }

    const term = code.trim().toLowerCase();
    const product = availableProducts.find((candidate) =>
      [candidate.sku, candidate.barcode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase() === term)
    );

    if (!product) {
      setError(
        availableProducts.length === 0
          ? "No products available for this supplier."
          : `No linked catalog product found for “${code}”.`
      );
      return;
    }

    addProductRow(product);
    setNotice(`${product.title} added to line items.`);
  }

  function handleRemoveItem(rowId: string) {
    setItems((current) => {
      if (current.length === 1) return [createRow()];
      return current.filter((item) => item.rowId !== rowId);
    });
  }

  function resetProductRowsForSupplier(supplier: Supplier | null) {
    const linkedIds = new Set(supplier?.productIds || []);
    setItems((current) =>
      current.map((item) => {
        if (!item.productId) return item;
        if (!linkedIds.has(item.productId)) {
          return {
            ...item,
            productId: "",
            name: "",
            sku: "",
            flavor: [],
            basePrice: 0,
            flavorCount: 1,
            availableStock: 0,
            quantity: 0,
            unitPrice: 0,
            unit: "Carton",
            taxRate: DEFAULT_TAX_RATE,
          };
        }

        const product = products.find((candidate) => candidate._id === item.productId);
        if (!product) return item;
        const flavors = defaultFlavorsFor(product, supplier);
        return {
          ...item,
          flavor: flavors,
          basePrice: purchaseBasePrice(product),
          flavorCount: (product.flavors?.length || 0) > 0 ? flavors.length : 1,
          unitPrice: flavorAdjustedPurchasePrice(product, flavors),
        };
      })
    );
  }

  function handleSupplierQueryChange(value: string) {
    setSupplierQuery(value);
    if (selectedSupplier && value !== supplierLabel(selectedSupplier)) {
      setSelectedSupplier(null);
      resetProductRowsForSupplier(null);
    }
  }

  function handleSupplierSelect(supplier: Supplier) {
    setSelectedSupplier(supplier);
    setSupplierQuery(supplierLabel(supplier));
    resetProductRowsForSupplier(supplier);
    setError(null);
  }

  function handlePurchaseDateChange(value: string) {
    if (!value) return;
    setPurchaseDate(value);
    if (!expectedDelivery || new Date(expectedDelivery) < new Date(value)) {
      setExpectedDelivery(addDays(value, 3));
    }
  }

  function validate(): string | null {
    if (!selectedSupplier) {
      return "Choose a supplier from the saved supplier list before saving.";
    }
    if (items.length === 0) {
      return "Add at least one line item.";
    }
    if (items.some((item) => !item.name.trim())) {
      return "Every line item needs a product or item name.";
    }
    if (items.some((item) => item.quantity <= 0)) {
      return "Every line item needs a quantity greater than 0.";
    }

    for (const item of items) {
      if (!item.productId) continue;
      const product = products.find((candidate) => candidate._id === item.productId);
      if (!product) continue;
      if (purchaseBasePrice(product) <= 0) {
        return `Set a purchase price for ${product.title} before saving.`;
      }
      if ((product.flavors?.length || 0) > 0 && toFlavorArray(item.flavor).length === 0) {
        return `Select at least one flavor for ${product.title}.`;
      }
    }

    if (totals.total <= 0) {
      return "Purchase total must be greater than 0.";
    }
    if (!Number.isFinite(paymentAmount) || paymentAmount < 0) {
      return "Payment amount cannot be negative.";
    }
    if (paymentAmount > remainingAmount) {
      return `Payment cannot exceed the remaining balance of ${formatRs(remainingAmount)}.`;
    }
    return null;
  }

  async function save(nextStatus: CreatePurchaseStatus = status) {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        supplierId: selectedSupplier!.id,
        purchaseDate,
        expectedDelivery,
        invoiceNumber,
        status: nextStatus,
        freight,
        notes,
        paymentAmount: editingPurchase ? 0 : paymentAmount,
        paymentMethod,
        paymentReference: invoiceNumber,
        items: items.map((item) => ({
          id: item.id,
          itemIndex: item.itemIndex,
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          flavor: toFlavorArray(item.flavor),
          quantity: item.quantity,
          availableStock: item.availableStock || 0,
          receivedQuantity: editingPurchase ? item.receivedQuantity || 0 : 0,
          unit: item.unit,
          basePrice: item.basePrice ?? 0,
          flavorCount: item.flavorCount ?? 1,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
        })),
      };

      const purchase = editingPurchase
        ? await updatePurchase(editingPurchase.purchaseNumber, payload)
        : await createPurchase(payload);

      if (editingPurchase && paymentAmount > 0) {
        await recordPurchasePayment(purchase.purchaseNumber, {
          amount: paymentAmount,
          method: paymentMethod,
          reference: invoiceNumber,
        });
      }

      const key = editingPurchase ? "updated" : "created";
      setSaving(false);
      router.push(`/purchases?${key}=${encodeURIComponent(purchase.purchaseNumber)}`);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save the purchase."
      );
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-10">
      <CreatePurchaseHeader
        purchaseCode={purchaseCode}
        saving={saving}
        mode={editingPurchase ? "edit" : "create"}
        status={status}
        onStatusChange={setStatus}
        onCancel={() => router.push("/purchases")}
        onSaveDraft={() => save("Draft")}
        onSavePurchase={() => save(status)}
      />

      <div className="mt-1 flex flex-col gap-5">
        <PurchaseContextCard
          supplierQuery={supplierQuery}
          onSupplierQueryChange={handleSupplierQueryChange}
          onSupplierSelect={handleSupplierSelect}
          selectedSupplier={selectedSupplier}
          suppliers={suppliers}
          suppliersLoading={suppliersLoading}
          supplierError={lookupError}
          purchaseDate={purchaseDate}
          onPurchaseDateChange={handlePurchaseDateChange}
          expectedDelivery={expectedDelivery}
          onExpectedDeliveryChange={setExpectedDelivery}
          invoiceNumber={invoiceNumber}
          onInvoiceNumberChange={setInvoiceNumber}
        />

        <PurchaseItemsTable
          items={items}
          products={availableProducts}
          productsLoading={productsLoading}
          emptyProductsMessage={emptyProductsMessage}
          onItemChange={updateItem}
          onProductSelect={handleProductSelect}
          onRemoveItem={handleRemoveItem}
          onAddItem={() => addProductRow()}
          onBarcodeScan={handleBarcodeScan}
        />

        <PurchaseSummaryCard
          totals={totals}
          paidAmount={paidAmount}
          unitsLabel={unitsLabel}
          freight={freight}
          onFreightChange={setFreight}
          notes={notes}
          onNotesChange={setNotes}
          selectedSupplier={selectedSupplier}
          onPreview={() => setPreviewOpen(true)}
          paymentAmount={paymentAmount}
          onPaymentAmountChange={setPaymentAmount}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
        />
      </div>

      <PurchasePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        purchaseCode={purchaseCode}
        supplier={selectedSupplier}
        items={items}
        totals={totals}
        purchaseDate={purchaseDate}
        expectedDelivery={expectedDelivery}
        invoiceNumber={invoiceNumber}
        notes={notes}
      />

      {loadingPurchase ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/20">
          <div className="rounded bg-surface-container-lowest px-4 py-2 font-body-medium text-body-medium text-on-surface shadow-lg">
            Loading purchase…
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="fixed bottom-4 right-4 z-[400] max-w-sm rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-dense text-body-dense text-on-surface shadow-md">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="fixed bottom-4 left-4 z-[400] max-w-sm rounded border border-error bg-error-container px-3 py-2 font-body-dense text-body-dense text-on-error-container shadow-md">
          {error}
        </div>
      ) : null}
    </div>
  );
}
