"use client";

import {
  DATE_OPTIONS,
  PAYMENT_FILTERS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  type PaymentFilter,
} from "../purchaseData";

type PurchasesToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  supplier: string;
  onSupplierChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  payment: PaymentFilter;
  onPaymentChange: (value: PaymentFilter) => void;
  supplierOptions: string[];
};

export function PurchasesToolbar({
  query,
  onQueryChange,
  supplier,
  onSupplierChange,
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  sort,
  onSortChange,
  payment,
  onPaymentChange,
  supplierOptions,
}: PurchasesToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-outline-variant bg-surface-container-lowest p-2.5">
      <div className="flex min-w-[280px] max-w-md flex-1 items-center gap-2">
        <div className="relative flex w-full items-center">
          <span className="material-symbols-outlined pointer-events-none absolute left-2.5 text-[18px] text-outline">
            search
          </span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by purchase ID, supplier, NTN or invoice…"
            className="h-[34px] w-full rounded border border-outline-variant bg-surface pl-8 pr-12 font-body-default text-body-default text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
          />
          <span className="pointer-events-none absolute right-2 rounded border border-outline-variant bg-surface-container-high px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-outline">
            K
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SelectControl value={supplier} onChange={onSupplierChange} options={supplierOptions} />

        <SelectControl
          value={status}
          onChange={onStatusChange}
          options={STATUS_OPTIONS as string[]}
        />

        <div className="relative">
          <select
            value={dateRange}
            onChange={(event) => onDateRangeChange(event.target.value)}
            className="h-[34px] appearance-none cursor-pointer rounded border border-outline-variant bg-surface pl-2.5 pr-8 font-mono-data-sm text-on-surface focus:border-primary-container focus:outline-none"
          >
            {DATE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2 text-[18px] text-outline">
            calendar_today
          </span>
        </div>

        <div className="flex h-[34px] items-center rounded border border-outline-variant bg-surface-container p-0.5">
          {PAYMENT_FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onPaymentChange(option)}
              className={`h-full rounded px-2.5 font-body-dense ${
                payment === option
                  ? "border border-outline-variant bg-surface-container-lowest font-body-medium text-primary"
                  : "font-body-default text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="h-[34px] cursor-pointer rounded border border-outline-variant bg-surface-container pl-2 pr-7 font-body-dense text-body-dense text-on-surface-variant focus:border-primary-container focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-1.5 top-2.5 text-[16px] text-outline">
            swap_vert
          </span>
        </div>
      </div>
    </div>
  );
}

function SelectControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[34px] appearance-none cursor-pointer rounded border border-outline-variant bg-surface pl-2.5 pr-8 font-body-default text-body-default text-on-surface focus:border-primary-container focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2 text-[18px] text-outline">
        expand_more
      </span>
    </div>
  );
}
