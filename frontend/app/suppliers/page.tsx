import { AppShell } from "../components/AppShell";
import { SuppliersView } from "../../features/suppliers/components/SuppliersView";

export default function SuppliersPage() {
  return (
    <AppShell activePath="suppliers">
      <SuppliersView />
    </AppShell>
  );
}
