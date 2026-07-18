import { Logo } from "@/components/shared/logo";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b bg-[var(--surface)] px-4 py-5 sm:px-6">
        <Logo />
      </header>
      <div className="flex min-h-[calc(100vh-5rem)] items-center">{children}</div>
    </div>
  );
}
