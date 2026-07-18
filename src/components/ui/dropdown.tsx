"use client";
import { useState } from "react";
export function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="rounded-lg px-3 py-2 hover:bg-white"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open && (
        <div className="surface absolute left-0 top-full z-30 mt-2 min-w-64 p-3">{children}</div>
      )}
    </div>
  );
}
