import { Badge } from "@/components/ui/badge";
export function ProductBadge({ sale }: { sale: boolean }) {
  return <Badge>{sale ? "Sale" : "Available"}</Badge>;
}
