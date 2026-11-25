"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import type { Customer } from "../../customers/types";
import { useCustomerLookup } from "../hooks/useCustomerLookup";

type CustomerAutocompleteProps = {
  customer: string;
  phone: string;
  location: string;
  onCustomerChange: (value: string) => void;
  onCustomerIdChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onLocationChange: (value: string) => void;
};

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 outline-none transition duration-200 hover:border-border focus:border-primary focus:ring-2 focus:ring-primary";

export function CustomerAutocomplete({
  customer,
  phone,
  location,
  onCustomerChange,
  onCustomerIdChange,
  onPhoneChange,
  onLocationChange,
}: CustomerAutocompleteProps) {
  const listId = useId();
  const { customers, loading, error } = useCustomerLookup();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = customer.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!query) return customers.slice(0, 6);

    return customers
      .filter((item) =>
        [item.name, item.business, item.phone, item.code, item.cityLabel, item.routeLabel]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 6);
  }, [customers, query]);

  function selectCustomer(item: Customer) {
    onCustomerChange(item.business || item.name);
    onCustomerIdChange(item.id);
    onPhoneChange(item.phone);
    onLocationChange(item.cityLabel || item.routeLabel || item.city);
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
      selectCustomer(matches[activeIndex]);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="relative flex min-w-0 flex-col gap-1.5 sm:col-span-2">
        <label
          htmlFor={`${listId}-customer`}
          className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant"
        >
          Customer
        </label>
        <div className="relative">
          <input
            id={`${listId}-customer`}
            value={customer}
            onChange={(event) => {
              onCustomerChange(event.target.value);
              onCustomerIdChange("");
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
            autoComplete="off"
            placeholder="Customer / shop name"
            className={INPUT_CLASS}
          />
        </div>

        {open ? (
          <div
            id={listId}
            role="listbox"
            aria-label="Saved customers"
            className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-xl border border-outline-variant/80 bg-surface-container-lowest py-1 shadow-panel"
            onMouseDown={(event) => event.preventDefault()}
          >
            <div className="border-b border-outline-variant/70 bg-surface-container-low px-3 py-2 font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant">
              {query ? "Matching saved customers" : "Saved customers"}
            </div>

            {matches.length > 0 ? (
              matches.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => selectCustomer(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full flex-col gap-1 border-b border-outline-variant/60 px-3 py-2.5 text-left transition duration-200 last:border-b-0 ${
                    index === activeIndex
                      ? "bg-primary-container/10"
                      : "hover:bg-row-hover focus-visible:bg-row-hover focus-visible:outline-none"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-body-medium text-body-medium text-on-surface">
                      {item.business || item.name}
                    </span>
                    <span className="shrink-0 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                      {item.code}
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-2 font-body-dense text-body-dense text-on-surface-variant">
                    <span>{item.phone}</span>
                    <span className="truncate">{item.cityLabel || item.routeLabel || item.city}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2.5 font-body-dense text-body-dense text-on-surface-variant">
                {loading
                  ? "Loading saved customers..."
                  : error
                    ? "Saved customers unavailable. You can still enter details manually."
                    : "No saved customers match. You can enter details manually."}
              </div>
            )}

            {query && matches.length === 0 ? (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 border-t border-outline-variant/70 bg-surface-container-low px-3 py-2.5 text-left font-body-dense text-body-dense text-primary transition duration-200 hover:bg-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Use “{customer.trim()}” as a manual customer
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <label className="flex min-w-0 flex-col gap-1.5">
        <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          Phone
        </span>
        <input
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          placeholder="0300-0000000"
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-3">
        <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          Location
        </span>
        <input
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          placeholder="Market / area"
          className={INPUT_CLASS}
        />
      </label>
    </div>
  );
}
