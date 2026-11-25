"use client";

import Link from "next/link";
import type { Brand } from "../types";

type BrandSelectProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  brands: Brand[];
  loading?: boolean;
  error?: string | null;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  /** Sentinel value that preserves a legacy free-text brand on edit. */
  legacyBrand?: string;
  /** Inactive brands excluded from selection unless already assigned here. */
  includeInactiveIds?: string[];
};

export function BrandSelect({
  id = "brandId",
  label = "Brand / Manufacturer",
  value,
  onChange,
  brands,
  loading = false,
  error = null,
  required = false,
  className = "",
  inputClassName =
    "h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-body-default text-body-default text-on-surface transition duration-200 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary",
  legacyBrand,
  includeInactiveIds = [],
}: BrandSelectProps) {
  const included = new Set(includeInactiveIds);
  const options = brands.filter((brand) => brand.isActive || included.has(brand._id));

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface" htmlFor={id}>
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      >
        <option value="">No Brand</option>
        {legacyBrand ? (
          <option value="legacy">Keep existing: {legacyBrand} (unlinked)</option>
        ) : null}
        {options.map((brand) => (
          <option key={brand._id} value={brand._id}>
            {brand.name}
            {brand.isActive ? "" : " (Inactive)"}
          </option>
        ))}
      </select>

      {loading ? (
        <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
          Loading brands...
        </span>
      ) : null}
      {error ? (
        <span className="font-body-dense text-body-dense text-error">
          {error} <Link href="/brands" className="underline">Manage brands</Link>
        </span>
      ) : null}
      {!loading && !error && options.length === 0 && !legacyBrand ? (
        <span className="font-body-dense text-body-dense text-on-surface-variant">
          No active brands yet. <Link href="/brands" className="text-primary underline">Add a brand</Link> before selecting one.
        </span>
      ) : null}
    </div>
  );
}
