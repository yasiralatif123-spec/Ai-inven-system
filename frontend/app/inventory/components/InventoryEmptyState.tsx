import type { ReactNode } from "react";

type InventoryEmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function InventoryEmptyState({
  icon,
  title,
  description,
  action,
}: InventoryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-4 py-16 text-center shadow-panel">
      <span className="material-symbols-outlined text-[30px] text-on-surface-variant">{icon}</span>
      <p className="font-headline-md text-headline-md text-on-surface">{title}</p>
      <p className="max-w-xl font-body-default text-body-default text-on-surface-variant">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
