import { AppShell } from "../../components/AppShell";
import { CreatePurchaseView } from "../../../features/purchases/components/CreatePurchaseView";

export default function CreatePurchasePage() {
  return (
    <AppShell activePath="purchases">
      <CreatePurchaseView />
    </AppShell>
  );
}
