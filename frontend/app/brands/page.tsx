import { AppShell } from "../components/AppShell";
import { BrandsView } from "../../features/brands/components/BrandsView";

export default function BrandsPage() {
  return (
    <AppShell activePath="brands">
      <BrandsView />
    </AppShell>
  );
}
