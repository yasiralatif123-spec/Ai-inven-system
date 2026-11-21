import { Suspense } from "react";
import { AppShell } from "../../components/AppShell";
import { CreatePurchaseView } from "../../../features/purchases/components/CreatePurchaseView";

export default function CreatePurchasePage() {
  return (
    <AppShell activePath="purchases">
      <Suspense
        fallback={
          <div className="flex min-h-[420px] items-center justify-center font-body-default text-body-default text-secondary">
            Loading purchase form…
          </div>
        }
      >
        <CreatePurchaseView />
      </Suspense>
    </AppShell>
  );
}
