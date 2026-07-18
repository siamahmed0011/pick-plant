import { AuthForm } from "@/components/auth/auth-form";
import { Container } from "@/components/shared/container";

export default function RegisterPage() {
  return (
    <main className="store-section">
      <Container>
        <AuthForm mode="register" />
      </Container>
    </main>
  );
}
