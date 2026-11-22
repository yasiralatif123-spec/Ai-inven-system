import type { Metadata } from "next";
import { RegisterView } from "../../features/auth/components/RegisterView";

export const metadata: Metadata = {
  title: "Accept Invitation - StockFlow",
  description: "Accept your StockFlow workspace invitation.",
};

export default function RegisterPage() {
  return <RegisterView />;
}
