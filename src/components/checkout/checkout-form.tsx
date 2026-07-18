import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function CheckoutForm() {
  return (
    <form className="surface grid gap-4 p-5">
      <label>
        Full Name
        <Input disabled placeholder="আপনার নাম" />
      </label>
      <label>
        Address
        <Input disabled placeholder="ডেলিভারি ঠিকানা" />
      </label>
      <Button disabled>Place Order</Button>
    </form>
  );
}
