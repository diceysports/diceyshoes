import type { ProductMedia } from "@/lib/types";

export interface RawMediaRow {
  mediaId: number;
  mediaType: string;
  angle: string | null;
  mediaUrl: string;
  isPrimary: boolean;
  usageStatus: string;
  verificationStatus: string;
  storefrontApproved: boolean;
}

/**
 * STRICT PRODUCTION RIGHTS GATE. A media row is only ever "storefrontSafe"
 * if ALL of:
 *  - usage_status grants real usage rights (not REFERENCE_ONLY/REJECTED)
 *  - verification_status is VERIFIED (not UNVERIFIED/BROKEN/MISMATCH/REJECTED)
 *  - storefront_approved is explicitly true
 *
 * As of this build, 100% of shoe_product_media rows fail this check, so
 * under strict production rules every master product falls back to the
 * generated placeholder.
 *
 * POC OVERRIDE: set POC_SHOW_ALL_MASTER_MEDIA=true to show every media
 * row that exists for a product (images and videos) regardless of the
 * flags above, for local prototype/demo purposes only. This is
 * deliberately a separate boolean (`shownAsPocPreview`) rather than a
 * change to `storefrontSafe` itself, so:
 *   - the strict gate's logic is untouched and easy to restore by
 *     simply removing the env var (or setting it to "false")
 *   - any code that specifically checks `storefrontSafe` (e.g. a future
 *     "is this cleared for real production use" report) still sees the
 *     honest answer
 *   - components that should render media use `visibleForCustomer`,
 *     which is `storefrontSafe || shownAsPocPreview`
 */
const SAFE_USAGE = new Set(["SELLER_AUTHORIZED", "API_AUTHORIZED", "SUPPLIER_AUTHORIZED", "APPROVED"]);

function isPocShowAllEnabled(): boolean {
  return process.env.POC_SHOW_ALL_MASTER_MEDIA === "true";
}

export function adaptMedia(rows: RawMediaRow[]): ProductMedia[] {
  const showAll = isPocShowAllEnabled();

  return rows.map((r) => {
    const storefrontSafe =
      SAFE_USAGE.has(r.usageStatus) &&
      r.verificationStatus === "VERIFIED" &&
      r.storefrontApproved === true;

    return {
      mediaId: r.mediaId,
      mediaType: r.mediaType as ProductMedia["mediaType"],
      angle: r.angle ?? "UNKNOWN",
      url: r.mediaUrl,
      isPrimary: r.isPrimary,
      storefrontSafe,
      shownAsPocPreview: showAll && !storefrontSafe,
    };
  });
}

/** What a component should actually check before rendering a media item. */
export function isVisibleForCustomer(media: ProductMedia): boolean {
  return media.storefrontSafe || media.shownAsPocPreview;
}

export function hasVisibleImage(media: ProductMedia[]): boolean {
  return media.some((m) => m.mediaType === "IMAGE" && isVisibleForCustomer(m));
}

export function visibleImages(media: ProductMedia[]): ProductMedia[] {
  return media.filter((m) => m.mediaType === "IMAGE" && isVisibleForCustomer(m));
}

export function visibleVideos(media: ProductMedia[]): ProductMedia[] {
  return media.filter((m) => m.mediaType === "VIDEO" && isVisibleForCustomer(m));
}
