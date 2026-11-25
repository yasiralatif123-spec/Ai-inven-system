"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import type { Product } from "../../../app/products/types";

type ProductMultiSelectProps = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  products: Product[];
  loading: boolean;
  error?: string | null;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const CONTROL_CLASS =
  "flex min-h-[34px] w-full flex-wrap items-center gap-1.5 rounded-lg border border-outline-variant/80 bg-surface-container-lowest p-1.5 pr-8 transition duration-200 hover:border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary";

export function ProductMultiSelect({
  selectedIds,
  onChange,
  products,
  loading,
  error,
}: ProductMultiSelectProps) {
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedProducts = useMemo(
    () => products.filter((product) => selectedSet.has(product._id)),
    [products, selectedSet]
  );

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      if (!term) return true;
      return [
        product.title,
        product.sku,
        product.barcode,
        product.brand,
        product.category,

      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
    return filtered.slice(0, 100);
  }, [products, query]);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.max(rect.width, 300);
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const maxHeight = Math.min(280, Math.max(140, Math.max(spaceBelow, spaceAbove)));
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

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function toggleProduct(id: string) {
    onChange(
      selectedSet.has(id)
        ? selectedIds.filter((productId) => productId !== id)
        : [...selectedIds, id]
    );
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
      toggleProduct(matches[activeIndex]._id);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className={CONTROL_CLASS}>
        {selectedProducts.map((product) => (
          <span
            key={product._id}
            className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-md bg-primary-container/15 px-2 py-1 font-body-dense text-body-dense text-on-primary-container"
          >
            <span className="truncate">{product.title}</span>
            <button
              type="button"
              aria-label={`Remove ${product.title}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => toggleProduct(product._id)}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md transition duration-200 hover:bg-primary-container/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="material-symbols-outlined text-[13px]">close</span>
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedIds.length ? "Search more products…" : "Search by product name or SKU…"}
          aria-label="Search products"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          className="min-w-[170px] flex-1 bg-transparent font-body-default text-body-default text-on-surface outline-none placeholder:text-on-surface-variant/70"
        />

        <button
          type="button"
          aria-label="Show products"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            inputRef.current?.focus();
            setOpen(true);
          }}
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md text-on-surface-variant transition duration-200 hover:bg-row-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-[16px]">expand_more</span>
        </button>
      </div>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={dropdownRef}
              id={listId}
              role="listbox"
              aria-multiselectable="true"
              aria-label="Products"
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
                maxHeight: position.maxHeight,
              }}
              className="fixed z-[250] flex flex-col overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel"
              onMouseDown={(event) => event.preventDefault()}
            >
              <div className="flex items-center justify-between border-b border-outline-variant/80 bg-surface-container px-3 py-2">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                  {query ? "Matching products" : "Products in catalog"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                    {selectedIds.length} selected
                  </span>
                  {selectedIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onChange([])}
                      className="rounded font-body-dense text-body-dense text-primary transition duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="px-3 py-3 font-body-dense text-body-dense text-on-surface-variant">
                    Loading products…
                  </div>
                ) : error ? (
                  <div className="px-2.5 py-3 font-body-dense text-body-dense text-error">
                    {error}
                  </div>
                ) : matches.length === 0 ? (
                  <div className="px-3 py-3 font-body-dense text-body-dense text-on-surface-variant">
                    No products match “{query}”.
                  </div>
                ) : (
                  matches.map((product, index) => {
                    const selected = selectedSet.has(product._id);
                    return (
                      <button
                        key={product._id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => toggleProduct(product._id)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex w-full items-center gap-2.5 border-b border-outline-variant/70 px-3 py-2 text-left transition duration-200 last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                          index === activeIndex
                            ? "bg-primary-container/10"
                            : "hover:bg-row-hover"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                            selected
                              ? "border-primary bg-primary text-on-primary"
                              : "border-outline-variant bg-surface-container-lowest"
                          }`}
                        >
                          {selected ? (
                            <span className="material-symbols-outlined text-[13px]">check</span>
                          ) : null}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={`truncate font-body-medium text-body-medium ${
                                selected ? "font-semibold text-on-surface" : "text-on-surface"
                              }`}
                            >
                              {product.title}
                            </span>
                            <span className="shrink-0 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                              {product.sku}
                            </span>
                          </span>
                          <span className="flex items-center justify-between gap-2 font-body-dense text-body-dense text-on-surface-variant">
                            <span className="truncate">
                              {[product.brand, product.category].filter(Boolean).join(" · ")}
                            </span>
                            <span className="shrink-0 font-mono-data-sm text-mono-data-sm">
                              Stock {Math.max(Number(product.openingStock) || 0, 0)}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
