import { Headphones, Truck } from "lucide-react";
import { Container } from "@/components/shared/container";
export function AnnouncementBar() {
  return (
    <div className="bg-[var(--primary)] text-white">
      <Container className="flex min-h-9 items-center justify-center gap-5 py-2 text-center text-xs sm:justify-between sm:text-sm">
        <p>{"ঢাকাসহ সারাদেশে নিরাপদে গাছ ডেলিভারি করা হয়।"}</p>
        <div className="hidden items-center gap-5 sm:flex">
          <span className="flex items-center gap-1">
            <Truck size={14} />
            Safe delivery
          </span>
          <span className="flex items-center gap-1">
            <Headphones size={14} />
            Call support
          </span>
        </div>
      </Container>
    </div>
  );
}
