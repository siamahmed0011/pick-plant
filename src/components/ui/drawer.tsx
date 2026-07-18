"use client";
import { useEffect, useRef } from "react";
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
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  return (
    <div
      className={open ? "fixed inset-0 z-50 bg-black/40" : "hidden"}
      onClick={onClose}
      aria-hidden={!open}
    >
      <aside
        ref={panelRef}
        tabIndex={-1}
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
