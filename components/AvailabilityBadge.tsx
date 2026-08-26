import type { AvailabilityState } from "@/lib/types";
import clsx from "clsx";

const COPY: Record<AvailabilityState, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  COMING_SOON: "Coming Soon",
  SOLD_OUT: "Sold Out",
};

export function AvailabilityBadge({ state }: { state: AvailabilityState }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-wide",
        state === "IN_STOCK" && "bg-accent-dim text-accent",
        state === "LOW_STOCK" && "bg-volt-dim text-[#7a8f00]",
        state === "COMING_SOON" && "bg-paper/[0.06] text-fog",
        state === "SOLD_OUT" && "bg-paper/[0.06] text-fog line-through decoration-2"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {COPY[state]}
    </span>
  );
}
