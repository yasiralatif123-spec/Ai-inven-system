"use client";

import type { TimelineEntry, TimelineTone } from "../supplierDetailData";

const DOT_CLASSES: Record<TimelineTone, string> = {
  amber: "bg-amber-500",
  primary: "bg-primary",
  secondary: "bg-secondary",
};

type SupplierActivityTimelineProps = {
  entries: TimelineEntry[];
};

export function SupplierActivityTimeline({ entries }: SupplierActivityTimelineProps) {
  return (
    <section className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-3.5 py-2.5">
        <div className="flex items-center gap-1.5 font-label-caps text-label-caps font-semibold uppercase tracking-wider text-on-surface">
          <span className="material-symbols-outlined text-[16px] text-secondary">history</span>
          <span>Chronological Activity Timeline</span>
        </div>
        <span className="font-mono-data-sm text-mono-data-sm text-secondary">Audit Trail</span>
      </div>

      <div className="flex flex-col p-3.5 font-body-default text-body-dense">
        {entries.length === 0 ? (
          <div className="py-4 text-center text-secondary">
            No purchase or payment activity recorded yet.
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex gap-3 ${
                index === entries.length - 1
                  ? "pt-3"
                  : `border-b border-outline-variant/60 ${index === 0 ? "pb-3" : "py-3"}`
              }`}
            >
              <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_CLASSES[entry.tone]}`} />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-medium text-on-surface">{entry.title}</span>
                  <span className="shrink-0 font-mono-data-sm text-[10px] text-secondary">
                    {entry.date}
                  </span>
                </div>
                <span className="font-mono-data-sm text-[11px] text-secondary">{entry.detail}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
