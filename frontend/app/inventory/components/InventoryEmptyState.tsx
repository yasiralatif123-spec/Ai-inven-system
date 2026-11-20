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
    <div className="flex flex-col items-center justify-center gap-2 rounded border border-outline-variant bg-surface-container-lowest px-4 py-14 text-center">
      <span className="material-symbols-outlined text-[28px] text-outline">{icon}</span>
      <p className="font-headline-md text-headline-md text-on-surface">{title}</p>
      <p className="max-w-xl font-body-dense text-body-dense text-secondary">{description}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
