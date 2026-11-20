import { AppShell } from "./components/AppShell";
import { DashboardView } from "../features/dashboard/components/DashboardView";

export default function DashboardPage() {
  return (
    <AppShell activePath="dashboard">
      <DashboardView />
    </AppShell>
  );
}
