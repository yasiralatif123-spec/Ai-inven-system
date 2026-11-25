import type { Customer } from "../types";
import { formatNumber, formatRs, getRowClasses, getStatusClasses, isOverLimit } from "../utils";
import { CustomerActionsMenu } from "./CustomerActionsMenu";

type CustomersTableProps = {
  customers: Customer[];
  selectedIds: string[];
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  openMenuId: string | null;
  onMenuToggle: (id: string) => void;
  onOpenProfile: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onCreateSale: (customer: Customer) => void;
  onRecordPayment: (customer: Customer) => void;
};

function OutstandingCell({ customer }: { customer: Customer }) {
  const overLimit = isOverLimit(customer);

  return (
    <div className="flex flex-col items-end">
      <span
        className={`font-mono-data text-mono-data tabular-nums ${
          overLimit
            ? "font-semibold text-error"
            : customer.outstanding > 0
              ? "font-medium text-on-surface"
              : "text-secondary"
        }`}
      >
        {formatRs(customer.outstanding)}
      </span>
      {overLimit ? (
        <span className="mt-0.5 rounded-md border border-error/20 bg-error-container/40 px-1.5 py-0.5 font-mono-data-sm text-[10px] font-medium text-error">
          +{formatRs(customer.outstanding - customer.creditLimit)} over
        </span>
      ) : customer.outstanding === 0 ? (
        <span className="mt-0.5 font-mono-data-sm text-[10px] font-medium text-primary">Nil</span>
      ) : null}
    </div>
  );
}

export function CustomersTable({
  customers,
  selectedIds,
  onToggleRow,
  onToggleAll,
  openMenuId,
  onMenuToggle,
  onOpenProfile,
  onEdit,
  onDelete,
  onCreateSale,
  onRecordPayment,
}: CustomersTableProps) {
  const allSelected = customers.length > 0 && selectedIds.length === customers.length;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-panel">
      <div className="min-h-[520px] overflow-x-auto overflow-y-visible">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="h-10 select-none border-b border-outline-variant/80 bg-surface-container-low font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              <th className="w-12 px-4 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Select all customers"
                  className="h-3.5 w-3.5 cursor-pointer rounded border-outline-variant accent-primary focus:ring-0"
                />
              </th>
              <th className="min-w-[220px] whitespace-nowrap px-4">Customer / Business</th>
              <th className="min-w-[130px] whitespace-nowrap px-4">Contact No.</th>
              <th className="min-w-[105px] whitespace-nowrap px-4 text-right">Total Orders</th>
              <th className="min-w-[125px] whitespace-nowrap px-4 text-right">Total Purchases</th>
              <th className="min-w-[145px] whitespace-nowrap px-4 text-right">Outstanding (PKR)</th>
              <th className="min-w-[115px] whitespace-nowrap px-4 text-right">Credit Limit</th>
              <th className="min-w-[100px] whitespace-nowrap px-4 text-center">Status</th>
              <th className="w-14 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70 font-body-default text-body-default">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant">
                      <span className="material-symbols-outlined text-[22px]">person_search</span>
                    </span>
                    <div className="font-body-medium text-body-medium text-on-surface">
                      No customers match these filters
                    </div>
                    <div className="mt-0.5 font-body-dense text-body-dense text-on-surface-variant">
                      Add a customer or adjust the search, route, type, status, and balance filters.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((customer) => {
                const selected = selectedIds.includes(customer.id);

                return (
                  <tr
                    key={customer.id}
                    onClick={() => onOpenProfile(customer)}
                    className={`cursor-pointer transition-colors ${getRowClasses(customer, selected)}`}
                  >
                    <td className="mt-0.5 px-4 py-3 text-center align-top">
                      <input
                        type="checkbox"
                        checked={selected}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => onToggleRow(customer.id)}
                        aria-label={`Select ${customer.name}`}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-outline-variant accent-primary focus:ring-0"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-body-medium text-body-medium leading-tight text-on-surface">
                          {customer.name}
                        </span>
                        <span className="mt-0.5 font-body-dense text-body-dense leading-tight text-secondary">
                          {customer.business}
                        </span>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="rounded-md border border-outline-variant/70 bg-surface-container-high px-1.5 py-0.5 font-mono-data-sm text-[10px] text-secondary">
                            {customer.routeLabel}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                        {customer.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <span className="font-mono-data text-mono-data tabular-nums text-on-surface">
                        {formatNumber(customer.orders)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <span className="font-mono-data text-mono-data tabular-nums text-on-surface">
                        {formatRs(customer.totalPurchases)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <OutstandingCell customer={customer} />
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <span className="font-mono-data text-mono-data tabular-nums text-secondary">
                        {formatRs(customer.creditLimit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center align-top">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 font-label-caps text-[10px] font-semibold uppercase tracking-wider ${getStatusClasses(
                          customer.status
                        )}`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center align-top">
                      <CustomerActionsMenu
                        customer={customer}
                        open={openMenuId === customer.id}
                        onToggle={() => onMenuToggle(customer.id)}
                        onOpenProfile={onOpenProfile}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onCreateSale={onCreateSale}
                        onRecordPayment={onRecordPayment}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
