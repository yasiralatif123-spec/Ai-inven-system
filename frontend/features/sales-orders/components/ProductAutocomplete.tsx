"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { Product } from "../../../app/products/types";

type ProductAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onProductSelect: (product: Product) => void;
  onCommit?: (value: string) => void;
  products: Product[];
  loading: boolean;
  error: string | null;
  ariaLabel: string;
};

const INPUT_CLASS =
  "h-8 w-full rounded border border-outline-variant bg-surface px-2 font-body-default text-body-dense text-on-surface placeholder:text-outline focus:border-primary focus:outline-none";

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function formatPrice(product: Product): number {
  return product.wholesalePrice || product.retailPrice || product.purchasePrice || 0;
}

export function ProductAutocomplete({
  value,
  onChange,
  onProductSelect,
  onCommit,
  products,
  loading,
  error,
  ariaLabel,
}: ProductAutocompleteProps) {
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
        [product.title, product.sku, product.barcode, product.brand, product.category]
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
    <div className="relative col-span-12 sm:col-span-4">
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
          onBlur={() => {
            onCommit?.(value);
            setOpen(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Item name"
          aria-label={ariaLabel}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          className={`${INPUT_CLASS} pr-7`}
        />
        <button
          type="button"
          aria-label="Show products"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            inputRef.current?.focus();
            setOpen(true);
          }}
          className="absolute right-1.5 top-1 flex h-6 w-6 items-center justify-center rounded text-outline transition-colors hover:bg-surface-container hover:text-primary"
        >
          <span className="material-symbols-outlined text-[15px]">expand_more</span>
        </button>
      </div>

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
              className="fixed z-[200] overflow-y-auto rounded border border-outline-variant bg-surface-container-lowest shadow-xl"
              onMouseDown={(event) => event.preventDefault()}
            >
          <div className="border-b border-outline-variant bg-surface-container-high/50 px-2.5 py-1.5 font-label-caps text-[10px] uppercase tracking-wide text-secondary">
            {query ? "Matching products" : "Products from catalog"}
          </div>

          {matches.length > 0 ? (
            matches.map((product, index) => (
              <button
                key={product._id || product.sku}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => selectProduct(product)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full flex-col gap-0.5 border-b border-outline-variant/60 px-2.5 py-2 text-left transition-colors last:border-b-0 ${
                  index === activeIndex ? "bg-primary-container/10" : "hover:bg-surface-container"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-body-medium text-body-medium text-on-surface">
                    {product.title}
                  </span>
                  <span className="shrink-0 font-mono-data-sm text-mono-data-sm text-outline">
                    {product.sku}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2 font-body-dense text-body-dense text-secondary">
                  <span className="truncate">
                    {[product.brand, product.category].filter(Boolean).join(" · ")}

                  </span>
                  <span className="shrink-0 font-mono-data-sm text-mono-data-sm">
                    Stock {Math.max(Number(product.openingStock) || 0, 0)} · Rs.{" "}
                    {formatPrice(product)}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <div className="px-2.5 py-2 font-body-dense text-body-dense text-secondary">
              {loading
                ? "Loading products..."
                : error
                  ? `Products unavailable: ${error}`
                  : "No products match. You can type an item name manually."}
            </div>
          )}

          {query && matches.length === 0 ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 border-t border-outline-variant bg-surface-container-low px-2.5 py-2 text-left font-body-dense text-body-dense text-primary transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[15px]">edit_note</span>
              Use “{value.trim()}” as a manual item
            </button>
          ) : null}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
