import type { Metadata } from "next";
import { RecoveryForm } from "@/components/auth/recovery-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Pick Plant account password.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordPage() {
  return <RecoveryForm mode="forgot" />;
}
