import { Suspense } from "react";
import { AppShell } from "../../components/AppShell";
import { CustomerProfile } from "../../../features/customers/components/CustomerProfile";

export default function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <AppShell activePath="customers">
      <Suspense
        fallback={
          <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest font-body-medium text-body-medium text-secondary">
            Loading customer profile...
          </div>
        }
      >
        {params.then(({ id }) => (
          <CustomerProfile key={id} customerId={id} />
        ))}
      </Suspense>
    </AppShell>
  );
}
