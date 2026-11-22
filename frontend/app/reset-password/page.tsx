import type { Metadata } from "next";
import { ResetPasswordView } from "../../features/auth/components/ResetPasswordView";

export const metadata: Metadata = {
  title: "Reset Password - StockFlow",
  description: "Set a new StockFlow password.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
