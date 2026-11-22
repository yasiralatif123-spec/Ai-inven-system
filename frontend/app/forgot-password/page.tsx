import type { Metadata } from "next";
import { ForgotPasswordView } from "../../features/auth/components/ForgotPasswordView";

export const metadata: Metadata = {
  title: "Forgot Password - StockFlow",
  description: "Request a StockFlow password reset link.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
