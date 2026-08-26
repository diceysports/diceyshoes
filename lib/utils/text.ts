/**
 * shoe_products.name is scraped and often carries marketplace cruft:
 * " | Flight Club", eBay listing numbers, "(No Box)", size call-outs,
 * and — importantly — raw style-code fragments embedded directly in the
 * title (e.g. "CQ4277 001", "[CQ4277]", "DI1481", "GX6141"). None of
 * that belongs in a customer-facing product name. This is display-only
 * cleanup applied in the adapter layer — it never writes back to the DB.
 */

// Matches uppercase-letter+digit style-code shapes: 1-3 letters then
// 3-6 digits, optionally followed by a hyphen/space and 2-4 more
// digits. Requires uppercase letters, which real title words in this
// scraped data essentially never combine with trailing digits the way
// a style code does (brand/model words like "OG", "SP", "III" don't
// match — no digits attached).
const STYLE_CODE_PATTERN = /\b[A-Z]{1,3}\d{3,6}(?:[-\s]?\d{2,4})?\b/g;

export interface CleanedName {
  name: string;
  /** First style-code-shaped fragment found in the raw title, if any */
  extractedStyleCode: string | null;
}

export function cleanDisplayName(raw: string): CleanedName {
  let name = raw;

  // Strip " | Source Name" suffixes
  name = name.replace(/\s*\|.*$/, "");

  // Strip trailing eBay-style listing ids, e.g. "193150591433| eBay"
  name = name.replace(/\d{9,}\s*$/, "");

  // Strip common marketplace/condition call-outs
  name = name.replace(/\s*\((no box|sample|used|new|deadstock|ds)\)\s*$/i, "");

  // Find and remove embedded style-code fragments, e.g. turn
  // `Air Jordan 1 Retro High OG TS SP "Mocha" CD4487 100` into
  // `Air Jordan 1 Retro High OG TS SP "Mocha"` + extractedStyleCode "CD4487 100"
  let extractedStyleCode: string | null = null;
  name = name.replace(STYLE_CODE_PATTERN, (match) => {
    if (!extractedStyleCode) extractedStyleCode = match.trim();
    return "";
  });

  // Clean up brackets/parens left empty by the removal above
  name = name.replace(/[[(]\s*[\])]/g, "");

  // Collapse leftover doubled whitespace and stray punctuation spacing
  name = name.replace(/\s{2,}/g, " ").replace(/\s+([,.\-])/g, "$1").trim();
  name = name.replace(/[-–—]\s*$/, "").trim();

  return { name: name || raw.trim(), extractedStyleCode };
}
