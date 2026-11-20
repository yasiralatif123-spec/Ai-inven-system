"use client";

import { useState } from "react";
import { formatCompactRs, formatRs } from "../../../app/inventory/utils";
import type { SalesPeriod } from "../types";
import type { DashboardSnapshot } from "../types";
import { chartGeometry } from "../utils";

const PERIODS: Array<{ key: SalesPeriod; label: string }> = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "custom", label: "Custom" },
];

type SalesOverviewProps = {
  charts: DashboardSnapshot["charts"];
  summaries: DashboardSnapshot["chartSummaries"];
};

export function SalesOverview({ charts, summaries }: SalesOverviewProps) {
  const [period, setPeriod] = useState<SalesPeriod>("weekly");

  const buckets = charts[period];
  const summary = summaries[period];
  const geometry = chartGeometry(buckets.map((bucket) => bucket.amount));
  const priorPoints = buckets.map((bucket, index) => ({
    x: geometry.points[index].x,
    y: 180 - (bucket.priorAmount / geometry.niceMax) * 160,
  }));
  const currentIndex = Math.max(
    0,
    buckets.findIndex((bucket) => bucket.isCurrent)
  );
  const tooltipBucket = buckets[currentIndex];
  const tooltipChange =
    tooltipBucket.priorAmount > 0
      ? ((tooltipBucket.amount - tooltipBucket.priorAmount) / tooltipBucket.priorAmount) * 100
      : tooltipBucket.amount > 0
        ? 100
        : 0;
  const hasData = summary.current > 0 || summary.prior > 0;

  return (
    <section className="flex flex-col gap-3 rounded border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant pb-2">
        <div>
          <div className="font-headline-md text-headline-md text-on-surface">Sales Overview</div>
          <div className="font-body-dense text-body-dense text-secondary">
            Gross invoiced volume from saved orders ({formatRs(summary.current)} in this period)
          </div>
        </div>
        <div className="inline-flex rounded border border-outline-variant bg-surface-container p-0.5">
          {PERIODS.map((item) => {
            const active = period === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeriod(item.key)}
                className={`rounded px-2.5 py-1 font-mono-data-sm text-mono-data-sm transition-colors ${
                  active
                    ? "border border-outline-variant bg-surface-container-lowest font-medium text-primary shadow-sm"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative h-56 w-full pt-2">
        {hasData ? (
          <div
            className="pointer-events-none absolute top-[10%] z-10 -translate-x-1/2 rounded border border-outline bg-on-surface px-2.5 py-1.5 text-left text-surface-container-lowest shadow"
            style={{ left: `${Math.min(88, Math.max(12, (geometry.points[currentIndex].x / 800) * 100))}%` }}
          >
            <div className="flex items-center justify-between gap-3 font-label-caps text-label-caps uppercase text-surface-variant">
              <span>{tooltipBucket.label}</span>
              {tooltipBucket.isCurrent ? <span className="text-primary-fixed">TODAY</span> : null}
            </div>
            <div className="mt-0.5 font-mono-data text-mono-data font-semibold text-surface">
              {formatRs(tooltipBucket.amount)}
            </div>
            <div className="mt-0.5 font-mono-data-sm text-mono-data-sm text-primary-fixed">
              {tooltipChange >= 0 ? "+" : ""}
              {tooltipChange.toFixed(1)}% vs prior ({formatRs(tooltipBucket.priorAmount)})
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center font-body-dense text-body-dense text-secondary">
            No sales recorded in this period yet.
          </div>
        )}

        <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 200">
          <g stroke="#E5E2DB" strokeDasharray="2 2" strokeWidth="1">
            {geometry.gridValues.map((value, index) => (
              <line
                key={value}
                x1="45"
                x2="790"
                y1={180 - (value / geometry.niceMax) * 160}
                y2={180 - (value / geometry.niceMax) * 160}
                opacity={index === geometry.gridValues.length - 1 ? 1 : 0.9}
              />
            ))}
          </g>
          <g className="text-[10px]" fill="#6F7975" textAnchor="end">
            {geometry.gridValues.map((value, index) => (
              <text key={value} x="40" y={24 + index * 40}>
                {formatCompactRs(value).replace("Rs. ", "")}
              </text>
            ))}
          </g>

          <path
            d={`M ${priorPoints.map((point) => `${point.x} ${point.y}`).join(" L ")}`}
            fill="none"
            stroke="#BEC9C4"
            strokeDasharray="4 3"
            strokeWidth="1.5"
          />
          <path d={geometry.currentPath} fill="none" stroke="#1F6F5C" strokeWidth="1.75" />

          {geometry.points.map((point, index) => (
            <circle
              key={buckets[index].key}
              cx={point.x}
              cy={point.y}
              fill="#1F6F5C"
              opacity={buckets[index].isCurrent ? 1 : 0.6}
              r={buckets[index].isCurrent ? 5 : 3}
              stroke={buckets[index].isCurrent ? "#FFFFFF" : "none"}
              strokeWidth={buckets[index].isCurrent ? 2 : 0}
            />
          ))}
          {buckets[currentIndex] ? (
            <line
              opacity="0.4"
              stroke="#1F6F5C"
              strokeDasharray="2 2"
              strokeWidth="1"
              x1={geometry.points[currentIndex].x}
              x2={geometry.points[currentIndex].x}
              y1="20"
              y2="180"
            />
          ) : null}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant pt-1 font-mono-data-sm text-mono-data-sm text-secondary">
        <div
          className="grid w-full max-w-[720px] text-center"
          style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
        >
          {buckets.map((bucket) => (
            <span key={bucket.key} className={bucket.isCurrent ? "font-semibold text-primary" : ""}>
              {bucket.shortLabel} ({formatCompactRs(bucket.amount).replace("Rs. ", "")})
            </span>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-primary-container"></span>
            <span className="text-on-surface">Current Period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 border-t border-dashed border-outline-variant"></span>
            <span>Prior Period</span>
          </div>
        </div>
      </div>
    </section>
  );
}
