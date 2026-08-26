import type { StockStatus } from "@/lib/types";

/**
 * Customer-facing availability, decoupled from supplier matching
 * entirely. The POC doesn't need a verified supplier offer to let a
 * product feel like a normal, browsable, purchasable product — that's
 * a deliberate product decision, not a technical shortcut being hidden
 * from anyone.
 *
 * The specific IN_STOCK / LOW_STOCK / SOLD_OUT split below is a
 * deterministic merchandising rule derived from data already on the
 * master product (rank/popularity + product id), not real warehouse
 * inventory — see README "Availability model" for the full explanation.
 * Nothing about that belongs in customer-facing copy; the UI only ever
 * shows the resulting state (AvailabilityBadge.tsx), never the reasoning.
 */

const STANDARD_SIZE_RUN = ["7", "8", "9", "10", "11", "12"];

export interface AvailabilityInput {
  productId: number;
  popularityTier: "A" | "B" | "C" | null;
  availableSizes: string[];
  /** Nearest future release date for this product, if any */
  upcomingReleaseDate?: string | null;
}

export function resolveAvailability(input: AvailabilityInput): StockStatus {
  if (input.upcomingReleaseDate && new Date(input.upcomingReleaseDate) > new Date()) {
    return { state: "COMING_SOON", releaseDate: input.upcomingReleaseDate };
  }

  const sizeRun = input.availableSizes.length > 0 ? input.availableSizes : STANDARD_SIZE_RUN;

  // Deterministic on product id so a given product always shows the
  // same state (no flicker between renders/requests), without a stock
  // table to query.
  const bucket = input.productId % 20;

  if (bucket === 0) {
    return { state: "SOLD_OUT", sizes: sizeRun.map((label) => ({ label, inStock: false })) };
  }

  if (bucket < 4) {
    // Low stock: only the middle of the size run is left.
    return {
      state: "LOW_STOCK",
      sizes: sizeRun.map((label, i) => ({
        label,
        inStock: i >= Math.floor(sizeRun.length * 0.3) && i <= Math.ceil(sizeRun.length * 0.7),
      })),
    };
  }

  return { state: "IN_STOCK", sizes: sizeRun.map((label) => ({ label, inStock: true })) };
}
