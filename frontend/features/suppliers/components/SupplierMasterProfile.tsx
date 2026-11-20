"use client";

import type { MasterProfileRow } from "../supplierDetailData";

type SupplierMasterProfileProps = {
  vendorCode: string;
  rows: MasterProfileRow[];
};

export function SupplierMasterProfile({ vendorCode, rows }: SupplierMasterProfileProps) {
  return (
    <section className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-3.5 py-2.5">
        <div className="flex items-center gap-1.5 font-label-caps text-label-caps font-semibold uppercase tracking-wider text-on-surface">
          <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
          <span>Supplier Master Profile</span>
        </div>
        <span className="rounded border border-outline-variant bg-secondary-container px-1.5 py-0.5 font-mono-data-sm text-mono-data-sm text-on-secondary-container">
          {vendorCode}
        </span>
      </div>

      <div className="flex flex-col gap-3 divide-y divide-outline-variant/60 p-3.5 font-body-default text-body-dense">
        {rows.length === 0 ? (
          <div className="py-3 text-center text-secondary">No saved profile details.</div>
        ) : (
          rows.map((row) => (
            <div
              key={row.label}
              className={
                row.stacked
                  ? "flex flex-col gap-0.5 pt-2 first:pt-0"
                  : "flex items-start justify-between gap-3 pt-2 first:pt-0"
              }
            >
              <span className="shrink-0 text-secondary">{row.label}:</span>

              {row.stacked ? (
                <div>
                  <div className="font-medium text-on-surface">{row.value}</div>
                  {row.sub ? (
                    <div className="font-mono-data-sm text-mono-data-sm text-secondary">{row.sub}</div>
                  ) : null}
                  {row.subSecondary ? (
                    <div className="font-mono-data-sm text-mono-data-sm text-secondary">
                      {row.subSecondary}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-right">
                  <span className="font-mono-data font-medium text-on-surface">{row.value}</span>
                  {row.sub ? (
                    <div className="font-mono-data-sm text-[10px] font-medium text-[#2E7D58]">
                      {row.sub}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
