import { Select } from "@/components/ui/select";
export function ProductSort() {
  return (
    <label className="grid gap-1 text-sm">
      Sort products
      <Select aria-label="Sort products" defaultValue="recommended">
        <option value="recommended">Recommended</option>
        <option value="price-low">Price: Low to High</option>
      </Select>
    </label>
  );
}
