# Dicey Shoes — Proof of Concept

A Next.js storefront built on the real Dicey Shoes Supabase project
(`mmazwydwswrkqgisotyt`). This is a proof of concept, not a finished
production build — see "Known POC Limitations" before treating anything
here as launch-ready.

## Requirements

- Node.js 18.18 or newer (Next.js 14 requirement)
- npm (or pnpm/yarn if you prefer — no lockfile is committed)
- Access to the `mmazwydwswrkqgisotyt` Supabase project's URL + anon key

## Installation

```
npm install
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values:

| Variable | Exposure | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (browser) | Yes | `https://mmazwydwswrkqgisotyt.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser) | Yes | Used by the browser client and by server code that only needs public data (`shoe_brands`). Carries no elevated access. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only, secret** | **Yes** | Bypasses RLS. Required because `shoe_products` only publicly exposes `status='PUBLISHED'` rows (all 1,000 current rows are `DRAFT`), and several tables (`shoe_colorways`, `shoe_product_media`, `shoe_supplier_products`, `shoe_supplier_product_images`, `shoe_supplier_variants`, `shoe_supplier_variant_inventory`, `shoe_suppliers`, and more) have RLS enabled with no public read policy at all. Used only in `lib/supabase/admin.ts`, imported only by `lib/data/{products,supplier,releases,search}.ts` and `app/api/search/route.ts`. **Never** prefix this `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_DEMO_PRODUCT_IDS` | Public (browser) | No | Comma-separated `product_id`s allowed to use the DEMO_PURCHASE flow. Empty disables demo purchases entirely. |
| `NEWS_DEV_PLACEHOLDERS` | Server | No | `true` shows clearly-labeled editorial placeholder articles, and only in `next dev` (`NODE_ENV=development`). Never enable in a deployed environment. |

**Never** put the service role key, supplier API keys, or any other secret
in a `NEXT_PUBLIC_` variable or in this README.

## Development

```
npm run dev
```

Runs at `http://localhost:3000`.

## Production build

```
npm run build
npm start
```

## Type checking / linting

```
npm run typecheck
npm run lint
```

## Supabase

This app expects the **existing** Dicey Shoes Supabase project, ref
`mmazwydwswrkqgisotyt`. It does not create a new project and does not
run any schema migrations. No table was altered to build this POC — the
app works entirely by reading `status`, `usage_status`,
`verification_status`, `storefront_approved`, `match_status`,
`authenticity_status`, and `resale_rights_status` as they already exist.

All reads go through the anon key + existing RLS policies
(`lib/supabase/server.ts` / `lib/supabase/client.ts`) **except** the four
data modules documented in "Security architecture" below, which use a
server-only service-role client because RLS doesn't publicly expose
their data. No table's RLS was modified anywhere in this build.

## Security architecture — why there are two server clients

Independent verification of the live RLS state found:

- `shoe_products` has RLS enabled with a public policy that only allows
  `SELECT` where `status = 'PUBLISHED'`. All 1,000 current master
  products are `status = 'DRAFT'` — so the anon client genuinely cannot
  read the catalog, by design.
- `shoe_brands` has a public read policy — the anon client is sufficient
  for it.
- `shoe_colorways`, `shoe_model_families`, `shoe_product_attributes`,
  `shoe_product_external_records`, `shoe_product_media`,
  `shoe_supplier_products`, `shoe_supplier_product_images`,
  `shoe_supplier_product_videos`, `shoe_supplier_variants`,
  `shoe_supplier_variant_inventory`, and `shoe_suppliers` have RLS
  enabled with **no public read policy at all**.

Given the instruction not to weaken RLS, add broad public policies, or
flip 1,000 real products to `PUBLISHED` just to make a POC work, this
app instead adds one narrow, deliberate boundary:

- **`lib/supabase/admin.ts`** — a `server-only`-guarded client using
  `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. It is imported only
  by `lib/data/products.ts`, `lib/data/supplier.ts`,
  `lib/data/releases.ts`, `lib/data/search.ts`, and (transitively)
  `app/api/search/route.ts`. `server-only` makes it a **build error**,
  not a runtime leak, if any `"use client"` file ever tries to import it.
- **`lib/supabase/client.ts` / `lib/supabase/server.ts`** — unchanged,
  anon-key only, still what the browser and `lib/data/brands.ts` use.

Because the service role bypasses RLS, **the server data layer itself is
now the security boundary**: every function in the four modules above
hand-picks only storefront-safe fields into the typed domain model
(`lib/types.ts`) before anything reaches a component. None of them
return `cost_price`, `raw_data`, internal notes, credentials, or
internal-only matching fields — see "Data exposure rules" below.

## Data exposure rules (enforced in the server data layer)

The following are read by the admin client (because RLS requires it) but
are **never** returned to a component, an API response, or the browser:

- supplier `cost_price` / wholesale pricing
- any `raw_data` JSONB column
- internal audit/matching records (`shoe_supplier_match_audit`)
- API credentials, worker tokens, or `credential_secret_name`
- internal-only status fields not converted into a public-facing state
  (e.g. `match_status` itself isn't shown — only the derived
  `AvailabilityState` from `lib/utils/availability.ts` is)

`/discover` and `/discover/[slug]` only ever return: title, public
brand/model/color as stored by the supplier, description, a display
price, sizes, available quantity, and `PUBLIC_SUPPLIER_FEED` images.

## Demo mode

Real availability (`lib/utils/availability.ts`) requires a supplier
offer with `match_status` in `EXACT`/`MATCHED`, `authenticity_status`
`VERIFIED`/`DOCUMENTED`, `resale_rights_status`
`BRAND_AUTHORIZED`/`RESELLER_CERTIFICATE`, and an in-stock variant. As of
this build, **zero** master products meet that bar (0 supplier products
are matched to a master product yet), so every master-catalog product
would otherwise show `CURRENTLY UNAVAILABLE`.

To let you click through cart → checkout, `NEXT_PUBLIC_DEMO_PRODUCT_IDS`
is a small explicit allowlist of `product_id`s that render a
`DEMO_PURCHASE` badge and a working (but clearly labeled) buy flow. Demo
items are tagged `isDemo: true` in cart state and show a "Demo / POC"
chip in the cart and checkout summary. This is not real inventory and
must not be treated as such — it exists only so the POC can be evaluated
end to end.

## Image rights

100% of `shoe_product_media` rows in the current database are
`usage_status = REFERENCE_ONLY`, `verification_status = UNVERIFIED`, and
`storefront_approved = false`. `lib/utils/media.ts` enforces that only
rows passing all three checks are ever rendered as a real `<Image>`; the
master catalog therefore renders the generated `ProductPlaceholder`
(brand name, model, style code, abstract shoe glyph — never a real
photo) everywhere today. The moment any row is approved for storefront
use, it will start rendering automatically — no component code needs to
change.

## Supplier collection ("Discover More Footwear")

`/discover` and `/discover/[slug]` use `shoe_supplier_products` +
`shoe_supplier_product_images` where `usage_scope = 'PUBLIC_SUPPLIER_FEED'`
(the ~15,753 Matterhorn images that do carry real display rights). This
collection is intentionally kept separate from the curated master
catalog per the project's matching rules — these are the supplier's own
titles/brands/colors, never presented as Nike/Jordan/etc. unless the
supplier data itself says so, and they are not merged into
`shoe_products`.

## Known POC limitations

- **Master image approval coverage: 0%.** Every master product shows a
  placeholder, not a photo, until enrichment approves real images.
- **Verified colorways: 0 of 1,000.** `getVerifiedColorway()` only
  surfaces `colorway_name`/`release_date` when `verification_status =
  VERIFIED`; today nothing qualifies, so PDPs show the base product
  name only.
- **Release data: 0 confirmed future releases.** `/releases`,
  `/new-releases`, and the homepage Release Radar all show honest empty
  states rather than invented dates.
- **News ingestion: not connected.** `/news` shows an empty state in
  any non-development environment. `NEWS_DEV_PLACEHOLDERS=true` locally
  shows two articles clearly labeled "Editorial Placeholder — Not Live
  News."
- **Payment: not active.** `/checkout` collects form input and shows a
  "Demo Order Recorded" confirmation; no payment processor is
  integrated and no card is charged.
- **Supplier matching: 0 of 4,988 supplier products are matched to a
  master product.** This is why real `AVAILABLE` state doesn't occur
  yet anywhere in the master catalog — see "Demo mode" above.
- **Price data quality:** `retail_price` mixes `RETAIL_REFERENCE` (755
  rows) and `MARKET_REFERENCE` (245 rows, resale-market-derived). The
  price adapter (`lib/utils/price.ts`) labels `MARKET_REFERENCE` prices
  distinctly and hides values above a sanity ceiling rather than
  display an obviously scraped number (e.g. a $17,000 "retail"
  Balenciaga row).
- **Newsletter signup is demo-only.** There is no
  `shoe_newsletter_signups` table; wire this to a real provider or a
  new table (via a proper migration) before relying on it.
- **Supplier image host is plain HTTP** (`srv0.matterhorn-wholesale.com`).
  Allow-listed in `next.config.mjs` and rendered with `unoptimized` —
  fine for a POC, worth a security/infra review before production.

## Runtime verification status

**CODE COMPLETE.** Every route, component, and data-layer function
described in this README has been written and statically self-reviewed
for import correctness, server/client boundaries, and type consistency.

**RUNTIME NOT VERIFIED IN THIS SANDBOX.** This build environment has no
network access, so `npm install`, `npm run dev`, `npm run build`, and
`npm run lint`/`typecheck` have **not** been executed against this code.
Run them yourself after `npm install` — if anything surfaces (a typo, a
missed edge case in a Supabase query shape), it should be a small fix
rather than a structural one, but treat "code complete" and "verified
working" as two different claims until you've run it.
