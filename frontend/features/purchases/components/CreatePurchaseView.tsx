"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "../../../app/products/types";
import type { Supplier } from "../../suppliers/types";
import { DEFAULT_TAX_RATE } from "../constants";
import { usePurchaseLookups } from "../hooks/usePurchaseLookups";
import {
  createPurchase,
  fetchNextPurchaseCode,
  fetchPurchase,
  updatePurchase,
} from "../services/purchase.service";
import type { CreatePurchaseStatus, PurchaseDto, PurchaseLineItem } from "../types";
import {
  addDays,
  calculatePurchaseTotals,
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
    flavor: "",
    quantity: 0,
    unit: "Carton",
    unitPrice: 0,
    discount: 0,
    taxRate: DEFAULT_TAX_RATE,
  };
}

function availableStock(product: Product): number {
  return Math.max(Number(product.openingStock) || 0, 0);
}

function defaultFlavorFor(product: Product, supplier: Supplier | null): string {
  const saved = supplier?.productFlavors?.[product._id] || "";
  if (!saved || !product.flavors?.length) return "";
  return (
    product.flavors.find((flavor) => flavor.toLowerCase() === saved.toLowerCase()) || ""
  );
}

function sameFlavorMap(
  left: Record<string, string> | undefined,
  right: Record<string, string> | undefined
): boolean {
  const a = left || {};
  const b = right || {};
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && a[key] === b[key])
  );
}

function supplierLabel(supplier: Supplier): string {
  return `${supplier.name} (#${supplier.code})`;
}

export function CreatePurchaseView() {
  const router = useRouter();
  const { suppliers, products, suppliersLoading, productsLoading, error: lookupError } =
    usePurchaseLookups();

  const [purchaseCode, setPurchaseCode] = useState("PO-2042");
  const [supplierQuery, setSupplierQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [items, setItems] = useState<PurchaseLineItem[]>(() => [createRow()]);
  const [freight, setFreight] = useState(0);
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseDto | null>(null);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const supplierPreselectedRef = useRef(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("edit")) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      const today = toIsoDate(new Date());

      setPurchaseCode("PO-2042");
      setSupplierQuery("");
      setSelectedSupplier(null);
      setPurchaseDate(today);
      setExpectedDelivery(addDays(today, 3));
      setInvoiceNumber("");
      setItems([createRow()]);
      setFreight(0);
      setNotes(DEFAULT_NOTES);
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
  }, []);

  useEffect(() => {
    if (supplierPreselectedRef.current || suppliers.length === 0 || selectedSupplier) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("edit")) return;

    const supplierId = params.get("supplierId");
    if (!supplierId) return;

    const target = suppliers.find((supplier) => supplier.id === supplierId);
    if (!target) return;

    const timer = window.setTimeout(() => {
      supplierPreselectedRef.current = true;
      setSelectedSupplier(target);
      setSupplierQuery(supplierLabel(target));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedSupplier, suppliers]);

  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
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
        setFreight(Number(purchase.financials?.freight) || 0);
        setNotes(purchase.notes || "");
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
              flavor: item.flavor || "",
              quantity: item.quantity,
              availableStock: Number(item.availableStock) || 0,
              receivedQuantity: Number(item.receivedQuantity) || 0,
              unit: item.unit,
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
  }, []);

  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => {
      setNotice(null);
      setError(null);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [notice, error]);

  const totals = useMemo(() => calculatePurchaseTotals(items, freight), [freight, items]);

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
      current.map((item) => (item.rowId === rowId ? { ...item, ...patch } : item))
    );
  }

  function addProductRow(product?: Product) {
    const row = createRow();
    if (product) {
      row.productId = product._id;
      row.name = product.title;
      row.sku = product.sku;
      row.flavor = defaultFlavorFor(product, activeSupplier);
      row.availableStock = availableStock(product);
      row.quantity = 0;
      row.unitPrice = Number(
        product.purchasePrice || product.wholesalePrice || product.retailPrice || 0
      );
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
      flavor: defaultFlavorFor(product, activeSupplier),
      availableStock: availableStock(product),
      quantity: 0,
      unitPrice: Number(
        product.purchasePrice || product.wholesalePrice || product.retailPrice || 0
      ),
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
            flavor: "",
            availableStock: 0,
            quantity: 0,
            unitPrice: 0,
            unit: "Carton",
            taxRate: DEFAULT_TAX_RATE,
          };
        }
        return {
          ...item,
          flavor: supplier?.productFlavors?.[item.productId] || "",
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
    if (totals.total <= 0) {
      return "Purchase total must be greater than 0.";
    }
    return null;
  }

  async function save(status: CreatePurchaseStatus) {
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
        status: editingPurchase
          ? (editingPurchase.status as CreatePurchaseStatus)
          : status,
        freight,
        notes,
        items: items.map((item) => ({
          id: item.id,
          itemIndex: item.itemIndex,
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          flavor: item.flavor || "",
          quantity: item.quantity,
          availableStock: item.availableStock || 0,
          receivedQuantity: item.receivedQuantity || 0,
          unit: item.unit,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
        })),
      };

      const purchase = editingPurchase
        ? await updatePurchase(editingPurchase.purchaseNumber, payload)
        : await createPurchase(payload);
      const key = editingPurchase ? "updated" : "created";

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
        onCancel={() => router.push("/purchases")}
        onSaveDraft={() => save("Draft")}
        onSavePurchase={() => save("Ordered")}
      />

      <div className="mt-1 grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-start">
        <div className="flex flex-col gap-4 xl:col-span-8">
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
        </div>

        <div className="flex flex-col gap-4 xl:col-span-4 xl:sticky xl:top-20">
          <PurchaseSummaryCard
            totals={totals}
            unitsLabel={unitsLabel}
            freight={freight}
            onFreightChange={setFreight}
            notes={notes}
            onNotesChange={setNotes}
            selectedSupplier={selectedSupplier}
            onPreview={() => setPreviewOpen(true)}
          />

          <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-3 font-mono-data-sm text-mono-data-sm text-secondary shadow-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {saving ? "Saving purchase…" : "Draft ready to review"}
            </span>
            <span>{purchaseCode}</span>
          </div>
        </div>
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
