/**
 * Shared presentation primitives for the Customer and Supplier profile pages.
 *
 * Styling only: no data access, hooks, calculations or actions live here. Both
 * profiles keep their own business logic and pass everything in as props.
 */
import type { ReactNode } from "react";

export type ProfileTone =
  | "success"
  | "warning"
  | "error"
  | "primary"
  | "secondary"
  | "neutral"
  | "none";

export const PROFILE_CARD =
  "rounded-lg border border-outline-variant bg-surface-container-lowest";
export const PROFILE_SUBHEADER =
  "flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-2.5";
export const PROFILE_TABLE_HEAD =
  "h-8 border-b border-outline-variant bg-surface-container-low font-label-caps text-label-caps uppercase tracking-wider text-secondary";
export const PROFILE_TABLE_ROW = "transition-colors hover:bg-row-hover";
export const PROFILE_NUMERIC = "font-mono-data text-mono-data tabular-nums";
export const PROFILE_ID_TOKEN =
  "inline-flex items-center rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-mono-data text-mono-data font-medium";

const BUTTON_BASE =
  "inline-flex h-[34px] items-center justify-center gap-1.5 rounded-lg font-body-medium text-body-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export const PROFILE_BUTTON_PRIMARY = `${BUTTON_BASE} bg-primary px-3.5 text-on-primary hover:bg-primary-hover active:bg-primary-hover`;
export const PROFILE_BUTTON_SECONDARY = `${BUTTON_BASE} border border-outline-variant bg-surface-container-lowest px-3 text-on-surface hover:bg-row-hover`;
export const PROFILE_BUTTON_QUIET = `${BUTTON_BASE} px-2.5 text-secondary hover:bg-row-hover hover:text-on-surface`;
export const PROFILE_BUTTON_ICON = `${BUTTON_BASE} w-[34px] border border-outline-variant bg-surface-container-lowest px-0 text-secondary hover:bg-row-hover hover:text-on-surface`;
export const PROFILE_BUTTON_DANGER_ICON = `${BUTTON_BASE} w-[34px] border border-outline-variant bg-surface-container-lowest px-0 text-error hover:bg-error-container/30 hover:text-error`;

const BADGE_BASE =
  "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold uppercase leading-tight tracking-wider";

const BADGE_TONES: Record<ProfileTone, string> = {
  success: "border-success-border bg-success-container text-success",
  warning: "border-warning-border bg-warning-container text-warning",
  error: "border-error/20 bg-error-container/60 text-error",
  primary: "border-primary/20 bg-primary-container/60 text-primary",
  secondary: "border-outline-variant bg-secondary-container text-on-secondary-container",
  neutral: "border-outline-variant bg-surface-container text-on-surface-variant",
  none: "",
};

const VALUE_TONES: Record<"neutral" | "primary" | "success" | "warning" | "error", string> = {
  neutral: "text-on-surface",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

const METRIC_SURFACES: Record<"default" | "error", string> = {
  default: "bg-surface-container-lowest",
  error: "bg-error-container/20",
};

export function ProfileBadge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: ProfileTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`${BADGE_BASE} ${BADGE_TONES[tone]} ${className}`}>{children}</span>
  );
}

export function ProfileMetaItem({
  icon,
  children,
  mono = false,
}: {
  icon?: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 font-body-dense text-body-dense text-on-surface-variant">
      {icon ? (
        <span className="material-symbols-outlined shrink-0 text-[16px] text-secondary">
          {icon}
        </span>
      ) : null}
      <span className={`min-w-0 truncate ${mono ? "font-mono-data-sm text-mono-data-sm" : ""}`}>
        {children}
      </span>
    </span>
  );
}

export function ProfileMetric({
  label,
  value,
  caption,
  valueTone = "neutral",
  surface = "default",
  accessory,
  className = "",
}: {
  label: string;
  value: string;
  caption?: string;
  valueTone?: "neutral" | "primary" | "success" | "warning" | "error";
  surface?: "default" | "error";
  accessory?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 px-4 py-3.5 lg:py-4 ${METRIC_SURFACES[surface]} ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
          {label}
        </span>
        {accessory}
      </div>
      <div
        className={`font-metric-display text-metric-display font-semibold tracking-tight tabular-nums ${VALUE_TONES[valueTone]}`}
      >
        {value}
      </div>
      {caption ? (
        <div className="font-mono-data-sm text-mono-data-sm text-secondary">{caption}</div>
      ) : null}
    </div>
  );
}

export const PROFILE_METRIC_GRID =
  "grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4";

export function ProfileEmptyState({
  icon,
  title,
  description,
  compact = false,
}: {
  icon: string;
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 px-6 text-center ${
        compact ? "py-9" : "min-h-[220px] py-12"
      }`}
    >
      <span className="material-symbols-outlined text-[26px] text-outline">{icon}</span>
      <div className="font-body-medium text-body-medium text-on-surface">{title}</div>
      {description ? (
        <div className="font-body-dense text-body-dense text-secondary">{description}</div>
      ) : null}
    </div>
  );
}

export function ProfileLoadingState({ label, detail }: { label: string; detail?: string }) {
  return (
    <div className={`${PROFILE_CARD} overflow-hidden`}>
      <div className="flex items-center gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3.5">
        <span className="material-symbols-outlined animate-spin text-[22px] text-primary">
          progress_activity
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="font-body-medium text-body-medium text-on-surface">{label}</div>
          {detail ? (
            <div className="font-mono-data-sm text-mono-data-sm text-secondary">{detail}</div>
          ) : null}
        </div>
      </div>

      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="flex flex-col gap-2 bg-surface-container-lowest px-4 py-4"
            >
              <div className="h-2.5 w-20 rounded bg-surface-container-high" />
              <div className="h-6 w-28 rounded bg-surface-container" />
              <div className="h-2 w-24 rounded bg-surface-container-high" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 px-4 py-4">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex items-center gap-3 border-b border-outline-variant/60 pb-2 last:border-b-0"
            >
              <div className="h-3 w-24 shrink-0 rounded bg-surface-container-high" />
              <div className="h-3 flex-1 rounded bg-surface-container" />
              <div className="h-3 w-16 shrink-0 rounded bg-surface-container-high" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileErrorState({
  message,
  onRetry,
  onBack,
  backLabel,
}: {
  message: string;
  onRetry: () => void;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <div className={`${PROFILE_CARD} flex min-h-[320px] flex-col items-center justify-center gap-3 p-6 text-center`}>
      <span className="material-symbols-outlined text-[28px] text-error">error_outline</span>
      <div className="font-body-medium text-body-medium text-on-surface">{message}</div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={onRetry} className={PROFILE_BUTTON_PRIMARY}>
          Retry
        </button>
        {onBack && backLabel ? (
          <button type="button" onClick={onBack} className={PROFILE_BUTTON_SECONDARY}>
            {backLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export type ProfileTabItem<T extends string> = {
  value: T;
  label: string;
  count?: number;
  icon?: string;
};

export function ProfileTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<ProfileTabItem<T>>;
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={`${PROFILE_CARD} flex items-center gap-1 overflow-x-auto px-1`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2 font-body-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            active === tab.value
              ? "border-primary bg-primary-container/10 font-body-medium text-primary"
              : "border-transparent text-on-surface-variant hover:bg-row-hover hover:text-on-surface"
          }`}
        >
          {tab.icon ? (
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
          ) : null}
          <span>{tab.label}</span>
          {tab.count !== undefined ? (
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono-data-sm text-[10px] leading-tight ${
                active === tab.value
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant bg-surface-container text-on-surface-variant"
              }`}
            >
              {tab.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
