import type { Customer } from "../types";

type CustomerActionsMenuProps = {
  customer: Customer;
  open: boolean;
  onToggle: () => void;
  onOpenProfile: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onCreateSale: (customer: Customer) => void;
  onRecordPayment: (customer: Customer) => void;
};

export function CustomerActionsMenu({
  customer,
  open,
  onToggle,
  onOpenProfile,
  onEdit,
  onDelete,
  onCreateSale,
  onRecordPayment,
}: CustomerActionsMenuProps) {
  return (
    <div className="relative inline-block text-left" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Actions for ${customer.name}`}
        aria-expanded={open}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          open
            ? "border border-outline-variant bg-surface-container-high text-on-surface"
            : "text-on-surface-variant hover:border border-outline-variant/70 hover:bg-row-hover hover:text-on-surface"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-9 z-[9999] flex w-48 flex-col rounded-lg border border-outline-variant/80 bg-surface-container-lowest py-1.5 text-left shadow-panel">
          <button
            type="button"
            onClick={() => onOpenProfile(customer)}
            className="flex items-center gap-2.5 px-3 py-2 font-body-default text-body-default text-on-surface transition duration-200 hover:bg-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
            Open Profile
          </button>
          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="flex items-center gap-2.5 px-3 py-2 font-body-default text-body-default text-on-surface transition duration-200 hover:bg-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit</span>
            Edit Customer Info
          </button>
          <button
            type="button"
            onClick={() => onDelete(customer)}
            className="flex items-center gap-2.5 px-3 py-2 font-body-default text-body-default text-error transition duration-200 hover:bg-error-container/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
          >
            <span className="material-symbols-outlined text-[16px] text-error">delete</span>
            Delete Customer
          </button>
          <div className="my-1 h-px bg-outline-variant/80" />
          <button
            type="button"
            onClick={() => onCreateSale(customer)}
            className="flex items-center gap-2.5 px-3 py-2 font-body-medium text-body-medium text-primary transition duration-200 hover:bg-primary-container/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              add_shopping_cart
            </span>
            + Create Sale Order
          </button>
          <button
            type="button"
            onClick={() => onRecordPayment(customer)}
            className="flex items-center gap-2.5 px-3 py-2 font-body-default text-body-default text-on-surface transition duration-200 hover:bg-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="font-mono-data-sm text-[12px] font-bold text-on-surface-variant">₨</span>
            Record Payment
          </button>
        </div>
      ) : null}
    </div>
  );
}
