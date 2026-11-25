"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { Product } from "../../../app/products/types";
import { formatStockWithPieces, parseMoneyInput } from "../../../app/lib/units";

type ProductPickerProps = {
  value: string;
  onChange: (value: string) => void;
  onProductSelect: (product: Product) => void;
  products: Product[];
  loading: boolean;
  ariaLabel: string;
  emptyMessage?: string;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const INPUT_CLASS =
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 pr-9 font-body-default text-body-default text-on-surface outline-none transition duration-200 hover:border-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container";

export function ProductPicker({
  value,
  onChange,
  onProductSelect,
  products,
  loading,
  ariaLabel,
  emptyMessage = "No products available for this supplier.",
}: ProductPickerProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.max(rect.width, 260);
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const maxHeight = Math.min(256, Math.max(120, Math.max(spaceBelow, spaceAbove)));
      const top =
        spaceBelow >= 160 || spaceBelow >= spaceAbove
          ? rect.bottom + 4
          : Math.max(8, rect.top - maxHeight - 4);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));

      setPosition({ top, left, width, maxHeight });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const query = value.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!query) return products.slice(0, 8);

    return products
      .filter((product) =>
        [
          product.title,
          product.sku,
          product.barcode,
          product.brand,
          product.category,

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 8);
  }, [products, query]);

  function selectProduct(product: Product) {
    onProductSelect(product);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, matches.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, -1));
      return;
    }

    if (event.key === "Enter" && open && activeIndex >= 0 && matches[activeIndex]) {
      event.preventDefault();
      selectProduct(matches[activeIndex]);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder="Product / SKU"
        aria-label={ariaLabel}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        className={`${INPUT_CLASS} pr-9`}
      />
      <button
        type="button"
        aria-label="Show products"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
        className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant transition duration-200 hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
      >
        <span className="material-symbols-outlined text-[16px]">expand_more</span>
      </button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              id={listId}
              role="listbox"
              aria-label="Products"
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
                maxHeight: position.maxHeight,
              }}
              className="fixed z-[200] overflow-y-auto rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel"
              onMouseDown={(event) => event.preventDefault()}
            >
              <div className="border-b border-outline-variant/70 bg-surface-container px-3 py-1.5 font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
                {query ? "Matching products" : "Products from catalog"}
              </div>

              {products.length === 0 ? (
                <div className="px-3 py-2.5 font-body-dense text-body-dense text-on-surface-variant">
                  {emptyMessage}
                </div>
              ) : matches.length > 0 ? (
                matches.map((product, index) => (
                  <button
                    key={product._id || product.sku}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onClick={() => selectProduct(product)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex w-full flex-col gap-1 border-b border-outline-variant/60 px-3 py-2.5 text-left transition duration-200 last:border-b-0 ${
                      index === activeIndex ? "bg-primary-container/10" : "hover:bg-surface-container"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-body-medium text-body-medium text-on-surface">
                        {product.title}
                      </span>
                      <span className="shrink-0 font-mono-data text-mono-data text-on-surface-variant">
                        {product.sku}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-2 font-body-dense text-body-dense text-on-surface-variant">
                      <span className="truncate">
                        {[product.brand, product.category].filter(Boolean).join(" · ")}

                      </span>
                      <span className="shrink-0 font-mono-data text-mono-data">
                        {formatStockWithPieces(product.openingStock)} · Rs.{" "}
                        {(parseMoneyInput(product.purchasePrice) ?? 0).toLocaleString("en-PK")} / Piece
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2.5 font-body-dense text-body-dense text-on-surface-variant">
                  {loading
                    ? "Loading products…"
                    : "No products match. You can type an item name manually."}
                </div>
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
