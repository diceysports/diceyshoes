import type { DisplayPrice, PriceType } from "@/lib/types";

export interface RawPrice {
  amount: number | string | null;
  currency: string | null;
  priceType: string | null;
  referenceAt: string | null;
}

// Category-agnostic sanity ceiling. Real luxury footwear can legitimately
// run into the low thousands (Balenciaga, Louis Vuitton) — the master
// catalog already has verified rows near $2,100. Above this, a
// MARKET_REFERENCE price is far more likely to be a scrape artifact
// (e.g. a $17,000 "retail" row) than a real number, so we hide it rather
// than risk damaging the storefront's credibility.
const MARKET_REFERENCE_CEILING = 6000;
const RETAIL_REFERENCE_CEILING = 20000; // luxury retail can legitimately be high

export function adaptPrice(raw: RawPrice): DisplayPrice {
  const amount = raw.amount === null ? null : Number(raw.amount);
  const type = (raw.priceType as PriceType) ?? null;
  const currency = raw.currency ?? "USD";

  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    return {
      amount: null,
      currency,
      type,
      referenceAt: raw.referenceAt,
      displayable: false,
      label: null,
    };
  }

  const ceiling =
    type === "MARKET_REFERENCE" ? MARKET_REFERENCE_CEILING : RETAIL_REFERENCE_CEILING;

  const displayable = amount <= ceiling;

  const label =
    type === "MARKET_REFERENCE"
      ? "Market Reference"
      : type === "RETAIL_REFERENCE"
      ? null // shown as a normal price, no extra label needed
      : "Reference Price";

  return { amount, currency, type, referenceAt: raw.referenceAt, displayable, label };
}

export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
