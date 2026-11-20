import { Suspense } from "react";
import { AppShell } from "../../components/AppShell";
import { SupplierDetailPage } from "../../../features/suppliers/components/SupplierDetailPage";

export default function SupplierProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <AppShell activePath="suppliers">
      <Suspense
        fallback={
          <div className="flex min-h-[520px] items-center justify-center rounded border border-outline-variant bg-surface-container-lowest font-body-medium text-body-medium text-secondary">
            Loading supplier profile...
          </div>
        }
      >
        {params.then(({ id }) => <SupplierDetailPage supplierId={id} />)}
      </Suspense>
    </AppShell>
  );
}
