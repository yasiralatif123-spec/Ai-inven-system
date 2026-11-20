import { AppShell } from "../components/AppShell";
import { SalesOrdersView } from "../../features/sales-orders/components/SalesOrdersView";

export default function SalesOrdersPage() {
  return (
    <AppShell activePath="sales-orders">
      <SalesOrdersView />
    </AppShell>
  );
}
