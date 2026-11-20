import { AppShell } from "../../components/AppShell";
import { AddCustomerForm } from "../../../features/customers/components/AddCustomerForm";

export default function AddCustomerPage() {
  return (
    <AppShell activePath="customers">
      <AddCustomerForm />
    </AppShell>
  );
}
