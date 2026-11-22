import type { Metadata } from "next";
import { LoginView } from "../../features/auth/components/LoginView";

export const metadata: Metadata = {
  title: "Sign in to StockFlow",
  description: "Sign in to manage your StockFlow wholesale stock, sales and payments.",
};

export default function LoginPage() {
  return <LoginView />;
}
