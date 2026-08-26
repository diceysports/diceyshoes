# DiceyShoes

A small Next.js storefront for a six-shoe sneaker line — one pair per face of a
die. The homepage widget rolls a die and picks the matching shoe.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS v4
- Cart state in React context, persisted to `localStorage`

## Routes

| Route                 | What it is                                            |
| --------------------- | ----------------------------------------------------- |
| `/`                   | Hero, dice-roll picker, full product grid             |
| `/shop`               | All six pairs                                         |
| `/product/[slug]`     | Product detail, size picker, add to cart (prerendered) |
| `/cart`               | Line items, quantities, subtotal, demo checkout       |
| anything else         | Custom 404 (`app/not-found.tsx`)                      |

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npm run typecheck
```

## Catalog data

Products live in `lib/products.ts` as a typed array — no database required.
`lib/supabase.example.ts` sketches what moving the catalog into Supabase would
look like. It is excluded from `tsconfig.json` on purpose, because
`@supabase/supabase-js` is not installed; the file's header comment lists the
steps to turn it on.

## Deployment

Deployed on Railway. The service builds with `npm run build` and serves with
`npm start`; `next start` binds to the `PORT` Railway provides.
