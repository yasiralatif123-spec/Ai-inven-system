"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import type { Supplier } from "../../suppliers/types";
import { formatRs, paymentTermsLabel } from "../utils";

type SupplierAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (supplier: Supplier) => void;
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
};

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 pr-9 font-body-default text-body-default text-on-surface outline-none transition duration-200 hover:border-border focus:border-primary focus:ring-2 focus:ring-primary";

export function SupplierAutocomplete({
  value,
  onChange,
  onSelect,
  suppliers,
  loading,
  error,
}: SupplierAutocompleteProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = value.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!query) return suppliers.slice(0, 8);

    return suppliers
      .filter((supplier) =>
        [supplier.name, supplier.code, supplier.contact, supplier.phone, supplier.hub, supplier.address]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 8);
  }, [query, suppliers]);

  function selectSupplier(supplier: Supplier) {
    onSelect(supplier);
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
      selectSupplier(matches[activeIndex]);
    }
  }

  return (
    <div className="relative flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="font-label-caps text-label-caps text-on-surface-variant">
          Supplier Name
        </label>
        <span className="font-body-dense text-body-dense text-on-surface-variant">
          {loading ? "Loading suppliers…" : `${suppliers.length} saved suppliers`}
        </span>
      </div>

      <div className="relative">
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-label="Supplier name"
          autoComplete="off"
          placeholder="Type a supplier name…"
          className={`${INPUT_CLASS} cursor-text`}
        />
        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-2.5 text-[19px] text-on-surface-variant">
          expand_more
        </span>
      </div>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Saved suppliers"
          className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel"
          onMouseDown={(event) => event.preventDefault()}
        >
          <div className="border-b border-outline-variant/70 bg-surface-container px-3 py-1.5 font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
            {query ? "Matching saved suppliers" : "All saved suppliers"}
          </div>

          {matches.length > 0 ? (
            matches.map((supplier, index) => (
              <button
                key={supplier.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => selectSupplier(supplier)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full flex-col gap-1 border-b border-outline-variant/60 px-3 py-2.5 text-left transition duration-200 last:border-b-0 ${
                  index === activeIndex ? "bg-primary-container/10" : "hover:bg-row-hover"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-body-medium text-body-medium text-on-surface">
                    {supplier.name}
                  </span>
                  <span className="shrink-0 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                    #{supplier.code}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2 font-body-dense text-body-dense text-on-surface-variant">
                  <span className="truncate">
                    {supplier.contact} · {supplier.phone}
                  </span>
                  <span className="shrink-0 font-mono-data-sm text-mono-data-sm">
                    Due {formatRs(supplier.outstanding)}
                  </span>
                </span>
                <span className="font-body-dense text-body-dense text-on-surface-variant">
                  {supplier.hub || supplier.region} · {paymentTermsLabel(supplier.paymentTerms)}
                </span>
              </button>
            ))
          ) : (
            <div className="px-3 py-2.5 font-body-dense text-body-dense text-on-surface-variant">
              {loading
                ? "Loading saved suppliers…"
                : error
                  ? `Suppliers unavailable: ${error}`
                  : "No saved suppliers match this name."}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
