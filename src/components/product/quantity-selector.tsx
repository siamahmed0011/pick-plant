"use client";
import { useState } from "react";
export function QuantitySelector({ stock }: { stock: number }) {
  const [value, setValue] = useState(1);
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold">Quantity</span>
      <div className="inline-flex items-center rounded-xl border bg-white">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={value <= 1}
          onClick={() => setValue((v) => Math.max(1, v - 1))}
          className="grid size-11 place-items-center text-lg disabled:opacity-40"
        >
          −
        </button>
        <output
          className="grid w-10 place-items-center font-semibold"
          aria-label="Current quantity"
        >
          {value}
        </output>
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={value >= stock}
          onClick={() => setValue((v) => Math.min(stock, v + 1))}
          className="grid size-11 place-items-center text-lg disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
