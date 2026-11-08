# Giftivana

_Distance doesn't have to feel so far._

Giftivana is an online gifting platform for sending flowers, cakes, chocolates, balloons, plants, gift baskets and **store gift cards** to family and friends in Syria and Iraq.

> **Status: in development — Stage 2 of 6.** Everything on the site is placeholder content. Partners are fictional, cities are demo destinations, and no payments are real. See [docs/STAGE-1-PLAN.md](docs/STAGE-1-PLAN.md) §7 for the launch requirements that must be resolved before any real transaction.

## Stack

|              | Version                                      | Notes                                                               |
| ------------ | -------------------------------------------- | ------------------------------------------------------------------- |
| Next.js      | 16.4                                         | App Router, Cache Components (partial prerendering), Server Actions |
| React        | 19.3                                         |                                                                     |
| TypeScript   | 5.x                                          | strict                                                              |
| Tailwind CSS | 4.x                                          | tokens in `src/styles/tokens.css` mapped via `@theme`               |
| Supabase     | `@supabase/ssr` 0.12, `supabase-js` 2.x      | wired in Stage 3                                                    |
| Zod          | 4.x                                          | all server-side validation                                          |
| Vitest       | 5.x                                          | unit tests                                                          |
| Fonts        | Fraunces + Figtree (Fontsource, self-hosted) | no build-time font downloads                                        |

Exact versions are pinned in `package-lock.json`. Node **22.12+** is required.

## Getting started

```bash
npm ci
cp .env.example .env.local   # fill in when Supabase is connected (Stage 3)
npm run dev                  # http://localhost:3000
```

Other commands:

```bash
npm run lint         # ESLint
npm run typecheck    # generates route types, then tsc --noEmit
npm run test         # Vitest
npm run build        # production build (also validates Cache Components rules)
npm run check        # all of the above
npm run demo:images  # regenerate placeholder SVGs in public/demo
```

## Project layout

```
docs/                 Plans, decisions, launch-readiness checklist
messages/en.json      All UI strings (Arabic/RTL ready: add ar.json, flip dir)
public/demo/          Generated placeholder artwork — not product photography
scripts/              Dev utilities
src/app/              Routes (App Router). (storefront) group = public shop
src/components/ui     Button, fields, badge, notice, skeleton
src/components/storefront, cart
src/data/demo.ts      Stage-2 demo catalog (becomes supabase/seed.sql in Stage 3)
src/lib/catalog       Read layer: queries.ts (data source), availability.ts (pure rules)
src/lib/cart          rules.ts (pure), store.tsx (localStorage via useSyncExternalStore)
src/lib/destination   Cookie-backed destination (server.ts read, actions.ts write)
src/lib/money         Integer minor-unit arithmetic and formatting
src/lib/i18n          t() and tList()
src/types/domain.ts   Types mirroring the database schema
tests/unit            Vitest
```

## How the pieces fit (Stage 2)

- **Destination** is an `httpOnly` cookie set by a Server Action after validating the city against the catalog. Server Components read it inside `<Suspense>` boundaries so the rest of each page prerenders.
- **Availability** is explicit: a product is purchasable in a city only if an availability row says so. Nothing is "available everywhere".
- **Money** is always `{ amountMinor, currency }`. Gift cards carry a _face value_ (SYP/IQD) and a separate _charge price_ (USD); no conversion is computed or implied.
- **Cart** lives in the browser as intent + a display snapshot. The server re-prices everything at checkout (Stage 4).

## Build stages

1. ✅ Plan, architecture, schema — `docs/STAGE-1-PLAN.md`
2. ✅ Project setup, design system, storefront on demo data
3. ⏳ Supabase: auth, migrations, seed, RLS
4. ⏳ Cart compatibility, checkout, orders, demo/manual payments, tracking
5. ⏳ Admin dashboard, partners, gift-card fulfillment
6. ⏳ Tests, security & accessibility review, launch-readiness checklist

## Not ready for real transactions

Payment availability, sanctions/export-control compliance, cross-border tax, gift-card partner agreements and legal text are unresolved. The site shows a permanent demo notice until these are cleared by qualified professionals.
