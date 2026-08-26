# Dicey Shoes

A Next.js storefront for the Dicey Shoes catalog, with a full-bleed autoplaying
video hero and a dice widget that picks a pair for you.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS v4
- Supabase (`mmazwydwswrkqgisotyt`) for the catalog
- Cart state in React context, persisted to `localStorage`

## Routes

| Route             | What it is                                             |
| ----------------- | ------------------------------------------------------ |
| `/`               | Video hero, dice-roll picker, featured grid            |
| `/shop`           | Catalog grid, ranked by `rank_score`                   |
| `/product/[slug]` | Product detail, sizes, add to cart (rendered on demand) |
| `/cart`           | Line items, quantities, subtotal, demo checkout        |
| anything else     | Custom 404 (`app/not-found.tsx`)                       |

## Environment

Copy `.env.example` to `.env.local` and fill it in:

- `NEXT_PUBLIC_SUPABASE_URL` — the project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — **optional, server-only**

The `public_read_published_shoes` RLS policy exposes only rows with
`status = 'PUBLISHED'` to the anon role. The catalog is currently entirely
`DRAFT`, so the anon key alone returns an empty storefront. Either set
`SUPABASE_SERVICE_ROLE_KEY` (read via a non-public env var, server components
only — it never reaches the browser), or publish the rows:

```sql
update shoe_products set status = 'PUBLISHED' where status = 'DRAFT';
```

Catalog reads are defensive: a missing key, an RLS-empty result or a network
failure renders an empty state rather than throwing, so a build never depends on
Supabase being reachable.

## Hero videos

Drop `.mp4` files into `public/videos/hero/`. `lib/heroVideos.ts` reads the
directory, so no code change is needed — see the README in that folder for
encoding guidance.

`components/HeroVideo.tsx` shuffles the clips, cross-fades between two stacked
`<video>` layers, and plays them muted, inline, autoplaying, with no controls.
The frame is 9:16 on phones and 16:9 from `sm` up. The media layers are
`pointer-events: none` and nothing calls `preventDefault` on touch, so dragging a
finger across the video scrolls the page normally on iOS.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npm run typecheck
```
