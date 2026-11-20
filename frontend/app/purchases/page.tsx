import { AppShell } from "../components/AppShell";
import { PurchasesView } from "../../features/purchases/components/PurchasesView";

export default function PurchasesPage() {
  return (
    <AppShell activePath="purchases">
      <PurchasesView />
    </AppShell>
  );
}
