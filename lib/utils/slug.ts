/**
 * shoe_products / shoe_supplier_products have no `slug` column, and scraped
 * titles are too messy (marketplace suffixes, listing IDs) to slugify
 * reliably. Rather than add a schema migration for a POC, we derive a
 * deterministic, human-readable, REVERSIBLE slug: `<brand>-<model>-<id>`.
 * The trailing numeric id is what routes actually resolve on — the words
 * before it are cosmetic/SEO only.
 */
function words(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function buildProductSlug(params: {
  id: number;
  brandSlug: string;
  model: string | null;
}): string {
  const modelPart = params.model ? words(params.model) : "shoe";
  return `${params.brandSlug}-${modelPart}-${params.id}`;
}

/** Extracts the trailing numeric id from any slug built above. */
export function idFromSlug(slug: string): number | null {
  const match = slug.match(/(\d+)$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}
