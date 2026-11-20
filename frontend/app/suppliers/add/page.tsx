import { AppShell } from "../../components/AppShell";
import { AddSupplierForm } from "../../../features/suppliers/components/AddSupplierForm";

export default function AddSupplierPage() {
  return (
    <AppShell activePath="suppliers">
      <AddSupplierForm />
    </AppShell>
  );
}
