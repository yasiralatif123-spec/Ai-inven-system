import type { Metadata } from "next";
import { RegisterView } from "../../features/auth/components/RegisterView";

export const metadata: Metadata = {
  title: "Create Business Account - StockFlow",
  description: "Set up your StockFlow wholesale business workspace.",
};

export default function RegisterPage() {
  return <RegisterView />;
}
