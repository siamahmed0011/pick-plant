import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
export function CartSummary({ subtotal = 0 }: { subtotal?: number }) {
  return (
    <Card>
      <h2 className="text-xl font-bold">Order Summary</h2>
      <div className="mt-4 flex justify-between">
        <span>Subtotal</span>
        <strong>{formatCurrency(subtotal)}</strong>
      </div>
    </Card>
  );
}
