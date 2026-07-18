import { RecoveryForm } from "@/components/auth/recovery-form";
import { Container } from "@/components/shared/container";

export default function ForgotPasswordPage() {
  return (
    <main className="store-section">
      <Container>
        <RecoveryForm mode="forgot" />
      </Container>
    </main>
  );
}
