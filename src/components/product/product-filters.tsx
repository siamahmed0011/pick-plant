"use client";
import { Checkbox } from "@/components/ui/checkbox";

export type ShopFilters = {
  categories: string[];
  light: string[];
  water: string[];
  difficulty: string[];
  petFriendly: string[];
  availability: string[];
  price: string;
};
export const emptyFilters: ShopFilters = {
  categories: [],
  light: [],
  water: [],
  difficulty: [],
  petFriendly: [],
  availability: [],
  price: "",
};
const filterGroups = [
  {
    key: "categories",
    title: "Categories",
    options: [
      "Indoor Plants",
      "Outdoor Plants",
      "Fruit Plants",
      "Flower Plants",
      "Medicinal Plants",
      "Spice Plants",
      "Seasonal Plants",
      "Seeds",
      "Pots & Planters",
      "Gardening Tools",
    ],
  },
  {
    key: "light",
    title: "Light Requirement",
    options: ["Low Light", "Medium Light", "Bright Light"],
  },
  { key: "water", title: "Water Requirement", options: ["Low", "Medium", "High"] },
  { key: "difficulty", title: "Difficulty", options: ["Easy", "Medium", "Advanced"] },
  { key: "petFriendly", title: "Pet Friendly", options: ["Yes", "No"] },
  { key: "availability", title: "Availability", options: ["In Stock", "Out of Stock"] },
] as const;
type Props = { value: ShopFilters; onChange: (value: ShopFilters) => void; onReset: () => void };
export function ProductFilters({ value, onChange, onReset }: Props) {
  const toggle = (key: keyof ShopFilters, option: string) => {
    const current = value[key];
    if (!Array.isArray(current)) return;
    onChange({
      ...value,
      [key]: current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    });
  };
  return (
    <aside className="surface p-5" aria-label="Product filters">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-semibold text-[var(--primary)] hover:underline"
        >
          Clear All
        </button>
      </div>
      <fieldset className="mt-5 border-t pt-5">
        <legend className="mb-3 font-semibold">Price Range</legend>
        <input
          aria-label="Minimum price"
          type="range"
          min="0"
          max="1500"
          value={value.price || 1500}
          onChange={(event) => onChange({ ...value, price: event.target.value })}
          className="w-full accent-[var(--primary)]"
        />
        <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
          <span>৳ 0</span>
          <span>৳ {value.price || 1500}</span>
        </div>
      </fieldset>
      <div className="mt-2 divide-y">
        {filterGroups.map((group) => (
          <fieldset className="py-5 last:pb-0" key={group.key}>
            <legend className="mb-3 font-semibold">{group.title}</legend>
            <div className="grid max-h-52 gap-3 overflow-y-auto">
              {group.options.map((option) => (
                <label className="flex items-center gap-3 text-sm text-[var(--muted)]" key={option}>
                  <Checkbox
                    checked={value[group.key].includes(option)}
                    onChange={() => toggle(group.key, option)}
                    name={group.key}
                    value={option}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </aside>
  );
}
