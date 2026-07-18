"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[60vh] place-items-center p-6 text-center">
      <div>
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="my-3 text-[var(--muted)]">অপ্রত্যাশিত সমস্যা হয়েছে। আবার চেষ্টা করুন।</p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </main>
  );
}
