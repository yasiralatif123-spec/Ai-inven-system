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
    <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-3 shadow-panel xl:flex-row xl:items-center xl:justify-between">
      <div className="flex w-full min-w-0 flex-1 items-center gap-2 xl:max-w-md">
        <div className="relative flex w-full items-center">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by purchase ID, supplier, NTN or invoice…"
            className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-9 pr-12 font-body-default text-body-default text-on-surface placeholder:text-on-surface-variant/70 transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="pointer-events-none absolute right-2 top-1.5 rounded-md border border-outline-variant bg-surface-container px-2 py-1 font-mono-data-sm text-mono-data-sm text-on-surface-variant">
            K
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
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
            className="h-9 appearance-none cursor-pointer rounded-lg border border-outline-variant bg-surface-container-lowest pl-3 pr-9 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {DATE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2 text-[18px] text-on-surface-variant">
            calendar_today
          </span>
        </div>

        <div className="flex h-9 items-center rounded-lg border border-outline-variant bg-surface-container p-1">
          {PAYMENT_FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onPaymentChange(option)}
              className={`h-full rounded-md px-3 font-body-medium text-body-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                payment === option
                  ? "border border-outline-variant bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
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
            className="h-9 cursor-pointer rounded-lg border border-outline-variant bg-surface-container-lowest pl-3 pr-9 font-body-medium text-body-medium text-on-surface-variant transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2 text-[17px] text-on-surface-variant">
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
        className="h-9 appearance-none cursor-pointer rounded-lg border border-outline-variant bg-surface-container-lowest pl-3 pr-9 font-body-medium text-body-medium text-on-surface transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2 text-[18px] text-on-surface-variant">
        expand_more
      </span>
    </div>
  );
}
