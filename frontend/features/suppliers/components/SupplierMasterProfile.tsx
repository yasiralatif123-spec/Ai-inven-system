"use client";

import type { MasterProfileRow } from "../supplierDetailData";
import {
  PROFILE_CARD,
  PROFILE_NUMERIC,
  PROFILE_SUBHEADER,
  ProfileBadge,
} from "../../profiles/profile-ui";

type SupplierMasterProfileProps = {
  vendorCode: string;
  rows: MasterProfileRow[];
};

export function SupplierMasterProfile({ vendorCode, rows }: SupplierMasterProfileProps) {
  return (
    <section className={`${PROFILE_CARD} overflow-hidden`}>
      <div className={PROFILE_SUBHEADER}>
        <div className="flex items-center gap-1.5 font-label-caps text-label-caps font-semibold uppercase tracking-wider text-on-surface">
          <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
          <span>Supplier Master Profile</span>
        </div>
        <ProfileBadge tone="primary">{vendorCode}</ProfileBadge>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3.5 font-body-default text-body-dense">
        {rows.length === 0 ? (
          <div className="py-4 text-center text-secondary">No saved profile details.</div>
        ) : (
          rows.map((row) => (
            <div
              key={row.label}
              className={
                row.stacked
                  ? "flex min-w-0 flex-col gap-0.5 border-b border-outline-variant/60 pb-3 last:border-b-0 last:pb-0"
                  : "flex min-w-0 items-start justify-between gap-3 border-b border-outline-variant/60 pb-3 last:border-b-0 last:pb-0"
              }
            >
              <span className="shrink-0 text-secondary">{row.label}:</span>

              {row.stacked ? (
                <div className="min-w-0">
                  <div className="break-words font-medium text-on-surface">{row.value}</div>
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
                <div className="min-w-0 text-right">
                  <span className={`${PROFILE_NUMERIC} font-medium`}>{row.value}</span>
                  {row.sub ? (
                    <div className="font-mono-data-sm text-[10px] font-medium text-success">
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
