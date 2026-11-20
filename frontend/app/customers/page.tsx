import { AppShell } from "../components/AppShell";
import { CustomersView } from "../../features/customers/components/CustomersView";

export default function CustomersPage() {
  return (
    <AppShell activePath="customers">
      <CustomersView />
    </AppShell>
  );
}
