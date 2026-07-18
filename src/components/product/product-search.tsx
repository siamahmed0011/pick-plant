import { Input } from "@/components/ui/input";
export function ProductSearch() {
  return (
    <label className="grid gap-1 text-sm">
      Search
      <Input type="search" placeholder="গাছ বা পণ্য খুঁজুন" />
    </label>
  );
}
