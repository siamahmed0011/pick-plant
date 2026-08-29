import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your Pick Plant account to start shopping for plants and gardening accessories with fast delivery across Bangladesh.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
