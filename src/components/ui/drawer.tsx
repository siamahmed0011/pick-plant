"use client";
import { Button } from "./button";
export function Drawer({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className={open ? "fixed inset-0 z-50 bg-black/40" : "hidden"} onClick={onClose}>
      <aside
        className="h-full w-[min(22rem,88vw)] bg-[var(--surface)] p-5"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <strong>{title}</strong>
          <Button variant="ghost" size="icon" aria-label="Close menu" onClick={onClose}>
            ×
          </Button>
        </div>
        {children}
      </aside>
    </div>
  );
}
