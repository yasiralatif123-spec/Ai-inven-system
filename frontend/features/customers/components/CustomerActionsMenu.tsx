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
        className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
          open
            ? "border border-outline-variant bg-surface-container-high text-on-surface"
            : "text-secondary hover:bg-surface-container hover:text-on-surface"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-8 z-[9999] flex w-44 flex-col rounded border border-outline-variant bg-surface-container-lowest py-1 text-left shadow-sm">
          <button
            type="button"
            onClick={() => onOpenProfile(customer)}
            className="flex items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[15px] text-secondary">person</span>
            Open Profile
          </button>
          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="flex items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[15px] text-secondary">edit</span>
            Edit Customer Info
          </button>
          <button
            type="button"
            onClick={() => onDelete(customer)}
            className="flex items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-error transition-colors hover:bg-[#fdf0ee]"
          >
            <span className="material-symbols-outlined text-[15px] text-error">delete</span>
            Delete Customer
          </button>
          <div className="my-1 h-px bg-outline-variant" />
          <button
            type="button"
            onClick={() => onCreateSale(customer)}
            className="flex items-center gap-2 px-3 py-1.5 font-body-medium text-body-medium text-primary transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[15px] text-primary">
              add_shopping_cart
            </span>
            + Create Sale Order
          </button>
          <button
            type="button"
            onClick={() => onRecordPayment(customer)}
            className="flex items-center gap-2 px-3 py-1.5 font-body-default text-body-default text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="font-mono-data-sm text-[12px] font-bold text-secondary">₨</span>
            Record Payment
          </button>
        </div>
      ) : null}
    </div>
  );
}
