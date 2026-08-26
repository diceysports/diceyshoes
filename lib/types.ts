/**
 * Domain model for Dicey Shoes.
 *
 * NOTE ON DIRECTION: the storefront no longer models supplier matching,
 * authenticity verification, or resale-rights status as a customer-facing
 * concept. That framework can still exist in the database for later use,
 * but nothing in this app queries or displays it. Availability is now a
 * simple, customer-friendly merchandising status derived from the master
 * catalog alone — see lib/utils/availability.ts.
 */

export type Gender = "MEN" | "WOMEN" | "UNISEX" | null;

export type PriceType = "RETAIL_REFERENCE" | "MARKET_REFERENCE" | null;

export interface DisplayPrice {
  amount: number | null;
  currency: string;
  type: PriceType;
  referenceAt: string | null;
  displayable: boolean;
  /** Human label to render next to the amount */
  label: string | null;
}

export interface Brand {
  brandId: number;
  name: string;
  slug: string;
}

export interface MasterProduct {
  productId: number;
  brand: Brand;
  /** Cleaned, customer-facing name — style-code fragments stripped out */
  name: string;
  model: string | null;
  colorway: string | null;
  /** Present only when the name-cleaner found a confident style code */
  styleCode: string | null;
  gender: Gender;
  category: string;
  description: string | null;
  price: DisplayPrice;
  popularityTier: "A" | "B" | "C" | null;
  rankScore: number;
  availableSizes: string[];
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  slug: string;
}

export interface ProductMedia {
  mediaId: number;
  mediaType: "IMAGE" | "VIDEO" | "360_FRAME" | "360_SEQUENCE" | "THUMBNAIL";
  angle: string;
  url: string;
  isPrimary: boolean;
  /** true if this row cleared the strict production rights gate */
  storefrontSafe: boolean;
  /** true if this row is being shown under the POC "show everything" flag */
  shownAsPocPreview: boolean;
}

export interface Colorway {
  colorwayId: number;
  masterProductId: number | null;
  familyId: number;
  colorwayName: string | null;
  releaseDate: string | null;
  verificationStatus: "PENDING" | "PARTIAL" | "VERIFIED" | "CONFLICT" | "REJECTED";
  media: ProductMedia[];
}

/**
 * Simple, customer-friendly merchandising status. No supplier matching
 * involved. See lib/utils/availability.ts for how this is derived.
 */
export type AvailabilityState = "IN_STOCK" | "LOW_STOCK" | "COMING_SOON" | "SOLD_OUT";

export interface StockStatus {
  state: AvailabilityState;
  sizes?: { label: string; inStock: boolean }[];
  releaseDate?: string;
}

export interface NewsArticle {
  slug: string;
  headline: string;
  category: string;
  summary: string;
  publishedAt: string;
  sourceName: string;
  sourceUrl: string;
  imageQuery?: string;
}

export interface ReleaseEntry {
  slug: string;
  brandName: string;
  productName: string;
  colorwayName: string | null;
  releaseDate: string;
  price: number | null;
  currency: string;
  sourceName: string;
  sourceUrl: string;
  /** true for a real release seeded from Nice Kicks; false = local catalog item */
  isExternalSeed: boolean;
  /** for external seeds only — no local product page to link to */
  externalImageQuery?: string;
}
