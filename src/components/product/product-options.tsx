"use client";
import { useState } from "react";
export function ProductOptions() {
  const [size, setSize] = useState("Medium");
  const [pot, setPot] = useState("Nursery Pot");
  return (
    <div className="grid gap-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Plant Size</legend>
        <div className="flex flex-wrap gap-2">
          {["Small", "Medium", "Large"].map((item) => (
            <button
              type="button"
              onClick={() => setSize(item)}
              className={`rounded-xl border px-4 py-2 text-sm ${size === item ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "bg-white"}`}
              aria-pressed={size === item}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Pot Option</legend>
        <div className="flex flex-wrap gap-2">
          {["Nursery Pot", "Ceramic Pot", "Decorative Planter"].map((item) => (
            <button
              type="button"
              onClick={() => setPot(item)}
              className={`rounded-xl border px-4 py-2 text-sm ${pot === item ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "bg-white"}`}
              aria-pressed={pot === item}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
