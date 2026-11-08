# Giftivana — Stage 1: Product Plan, Architecture & Data Model

> Status: planning document. Nothing in this file is a claim of delivery coverage, partner agreements, payment capability, or legal compliance. See §7 "Unresolved launch requirements".

---

## 1. Understanding of Giftivana

Giftivana ("Distance doesn't have to feel so far.") is an online gifting platform for people—primarily expats—who want to send thoughtful gifts to family and friends in **Syria** and **Iraq**. A customer picks a destination (country + city), browses what is actually available there, chooses products, adds recipient details, a delivery date, and a personal message, then places an order. Seven categories: flowers, cakes, chocolates, balloons, plants, curated gift baskets, and **store gift cards** (a first-class category purchased through the same flow, with placeholder partners until real partners exist).

The business constraints shape the design more than the features do: no payment processor chosen, no partner stores confirmed, cross-border/sanctions questions unresolved, and gift-card codes must never be fabricated. The MVP is therefore a complete, honest **ordering and operations system** with a demo payment path and manual fulfillment, structured so real providers and partners can be plugged in through configuration rather than code changes.

---

## 2. MVP scope

### In scope

| Area             | Included                                                                                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storefront       | Homepage, destination selector, catalog (filters: country, city, category, occasion, price; search; sort), product detail, gift-card catalog and detail, occasion pages                                                                             |
| Cart & checkout  | Single-destination/single-recipient/single-date cart, compatibility rules (physical vs digital), guest checkout, optional account, server-recalculated totals, delivery fees by zone                                                                |
| Payments         | Provider abstraction; **DemoPaymentProvider** (local/dev only, clearly labeled) and **ManualPaymentProvider** (admin marks payment received); no live provider                                                                                      |
| Orders           | Order creation with idempotency, status history, order confirmation, customer order history, tokenised guest tracking, public tracking page with coarse status only                                                                                 |
| Gift cards       | Partner-store management, denominations, face-value currency vs charge currency, fulfillment methods (digital / physical / manual — **manual default**), redemption instructions and terms, secure fulfillment data store with entitled-only access |
| Admin            | Products, categories, variants, images, availability, partners & locations, gift-card settings, delivery zones/fees/scheduling, orders, item-level fulfillment, payment status, support notes, audit log                                            |
| Platform         | Supabase (Postgres, Auth, Storage) with RLS; i18n-ready structure (English only shipped); mobile-first design system; tests + GitHub Actions                                                                                                        |
| Supporting pages | About, Contact, FAQ, Delivery info, Privacy (draft), Terms (draft), Gift-card terms (draft)                                                                                                                                                         |

### Explicitly out of scope for MVP

Loyalty programs, subscriptions, marketplace/seller onboarding, live payment integration, automated partner gift-card APIs, currency conversion, multi-recipient orders, Arabic translations (structure only), reviews/ratings, promo codes (schema leaves room; no UI).

---

## 3. Architecture

### 3.1 Stack & versions

Pinned versions are confirmed against the registry at scaffold time in Stage 2 and recorded in `package.json` and `README.md`. Targets:

- **Next.js 15** (App Router, Server Components, Server Actions, Route Handlers) — React 19, TypeScript 5
- **Tailwind CSS 4** with a token-based design system (CSS variables → Tailwind theme)
- **Supabase**: Postgres, Auth (email/password + magic link), Storage; `@supabase/ssr` for cookie-based sessions
- **Zod** for all server-side validation; **Vitest** for unit/integration tests; **Playwright** for a small set of critical flows
- **ESLint + Prettier**, **GitHub Actions** (lint, typecheck, test, build)

### 3.2 Guiding principles

1. **Server is the source of truth.** Prices, eligibility, totals, delivery fees, roles, and payment state are always computed/verified server-side. The client sends _intent_ (product IDs, variant IDs, quantities, recipient data), never money.
2. **Three distinct Supabase clients:**
   - `createBrowserClient()` — anon key, browser, RLS-enforced.
   - `createServerClient()` — anon key + user cookies, Server Components / Actions, RLS-enforced.
   - `createAdminClient()` — service-role key, **server-only** (`import "server-only"`), used only inside explicitly authorized code paths (checkout order creation, admin actions after `requireAdmin()`, fulfillment reveal after entitlement check). Never imported by anything reachable from a client bundle.
3. **Authorization is a server function, not a UI condition.** `requireUser()` / `requireStaff()` / `requireAdmin()` helpers read the session, load `profiles.role`, and throw/redirect. Every admin Server Action and Route Handler calls one. RLS is the second layer.
4. **Unified product model.** One `products` table with `product_type = 'physical' | 'gift_card'`; gift-card specifics live in `gift_card_products` (1:1) and `gift_card_denominations`.
5. **Money = integer minor units + explicit currency.** A `currencies` table records each currency's minor-unit exponent so SYP/IQD (0 decimals) and USD (2) are handled correctly.
6. **Snapshots on orders.** `order_items` copies name, option labels, unit price, currency, and (for gift cards) partner name, face value, face currency, fulfillment method, redemption instructions, and terms version at purchase time.
7. **Sensitive data is partitioned.** Recipient details live in `order_recipients`, gift-card secrets in `gift_card_fulfillments_secure`. Neither is selectable by anon, neither appears in list endpoints, and the secure table has **no customer RLS select policy at all**—access is only via a server function that checks entitlement and writes an audit row.
8. **Localisation-ready.** All UI strings go through a `t()` dictionary (`messages/en.json`); layout uses logical CSS properties (`ps-`, `me-`, `start`/`end`) so RTL is a `dir="rtl"` flip, not a redesign. Locale is a route segment reserved for later (`/[locale]/...` is _not_ used in MVP to keep URLs clean; a middleware-based locale can be added without moving files). No flags for languages.

### 3.3 Folder structure

```
giftivana/
├─ .github/workflows/ci.yml
├─ .env.example
├─ .gitignore
├─ README.md
├─ docs/
│  ├─ STAGE-1-PLAN.md              ← this file
│  ├─ DECISIONS.md                 ← ADR-style log of key choices
│  └─ LAUNCH-READINESS.md          ← grows through Stage 6
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/                  ← numbered SQL migrations
│  │  ├─ 0001_extensions_and_types.sql
│  │  ├─ 0002_core_tables.sql
│  │  ├─ 0003_catalog.sql
│  │  ├─ 0004_orders_and_payments.sql
│  │  ├─ 0005_fulfillment_and_audit.sql
│  │  ├─ 0006_functions.sql
│  │  └─ 0007_rls_policies.sql
│  └─ seed.sql                     ← repeatable demo data (idempotent)
├─ messages/
│  └─ en.json
├─ public/
│  └─ demo/                        ← demo product/partner imagery (clearly labeled)
├─ src/
│  ├─ app/
│  │  ├─ (storefront)/             ← public shop; shared storefront layout
│  │  │  ├─ page.tsx               ← homepage
│  │  │  ├─ gifts/                 ← catalog + [slug]
│  │  │  ├─ gift-cards/            ← gift-card catalog + [slug]
│  │  │  ├─ occasions/[slug]/
│  │  │  ├─ cart/
│  │  │  ├─ checkout/
│  │  │  ├─ orders/[orderNumber]/  ← confirmation (token-gated)
│  │  │  ├─ track/
│  │  │  └─ (pages)/ about, contact, faq, delivery, legal/*
│  │  ├─ (account)/account/        ← requires user
│  │  ├─ (auth)/auth/              ← sign-in, sign-up, callback, sign-out
│  │  ├─ admin/                    ← requires staff/admin (layout calls requireStaff)
│  │  ├─ api/
│  │  │  ├─ payments/demo/         ← demo provider endpoints (disabled unless DEMO_PAYMENTS=true)
│  │  │  └─ webhooks/payments/[provider]/
│  │  ├─ layout.tsx, globals.css, not-found.tsx, error.tsx
│  ├─ components/
│  │  ├─ ui/                       ← Button, Input, Select, Card, Badge, Dialog, Skeleton…
│  │  ├─ storefront/               ← ProductCard, DestinationPicker, CategoryGrid…
│  │  ├─ cart/, checkout/, orders/
│  │  └─ admin/
│  ├─ lib/
│  │  ├─ supabase/ { client.ts, server.ts, admin.ts, middleware.ts }
│  │  ├─ auth/ { session.ts, require.ts }
│  │  ├─ money/ { format.ts, math.ts }
│  │  ├─ catalog/ { queries.ts, availability.ts }
│  │  ├─ cart/ { store.ts (client), rules.ts (pure), server.ts }
│  │  ├─ checkout/ { schema.ts, create-order.ts, totals.ts }
│  │  ├─ payments/ { provider.ts (interface), demo.ts, manual.ts, registry.ts }
│  │  ├─ fulfillment/ { gift-card.ts, access.ts }
│  │  ├─ delivery/ { dates.ts (tz-aware), fees.ts }
│  │  ├─ i18n/ { t.ts, dir.ts }
│  │  └─ audit.ts
│  ├─ types/ { database.ts (generated), domain.ts }
│  └─ styles/tokens.css
├─ tests/
│  ├─ unit/        (vitest: rules, totals, money, dates, denomination validation)
│  ├─ integration/ (vitest + local Supabase: RLS, order creation, idempotency)
│  └─ e2e/         (playwright: browse → cart → checkout → confirmation)
├─ next.config.ts, tailwind.config.ts, tsconfig.json, vitest.config.ts, playwright.config.ts
└─ package.json
```

---

## 4. Route map

### Storefront (public)

| Route                                                                                                 | Purpose                                                                                                                             | Rendering                                                         |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `/`                                                                                                   | Homepage: hero, destination selector, categories, featured, gift-card section, how it works, occasions                              | Server                                                            |
| `/gifts`                                                                                              | Physical-gift catalog with filters/search/sort (query params: `country`, `city`, `category`, `occasion`, `min`, `max`, `q`, `sort`) | Server + client filter bar                                        |
| `/gifts/[slug]`                                                                                       | Product detail                                                                                                                      | Server; client for options/qty/add-to-cart                        |
| `/gift-cards`                                                                                         | Gift-card catalog (filters: country, city, store category)                                                                          | Server                                                            |
| `/gift-cards/[slug]`                                                                                  | Gift-card detail (denominations, face vs charge price, fulfillment, terms)                                                          | Server + client purchase form                                     |
| `/occasions/[slug]`                                                                                   | Occasion landing (e.g. birthday, new baby)                                                                                          | Server                                                            |
| `/cart`                                                                                               | Cart review, compatibility warnings, destination change handling                                                                    | Client (cart in localStorage; mirrored to `carts` when signed in) |
| `/checkout`                                                                                           | Multi-section checkout (sender, recipient, delivery, message, review, payment)                                                      | Client form → Server Action                                       |
| `/orders/[orderNumber]?t=<token>`                                                                     | Confirmation; token or ownership required                                                                                           | Server                                                            |
| `/track`                                                                                              | Enter order number + email/phone → coarse timeline                                                                                  | Server Action                                                     |
| `/about`, `/contact`, `/faq`, `/delivery`, `/legal/privacy`, `/legal/terms`, `/legal/gift-card-terms` | Supporting pages (legal marked DRAFT)                                                                                               | Static                                                            |

### Auth & account

| Route                                                                | Purpose                                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `/auth/sign-in`, `/auth/sign-up`, `/auth/callback`, `/auth/sign-out` | Supabase Auth                                                                        |
| `/account`                                                           | Profile                                                                              |
| `/account/orders`, `/account/orders/[id]`                            | History and detail (full detail incl. recipient; gift-card reveal via server action) |
| `/account/recipients`                                                | Saved recipients (post-core-MVP, scaffolded)                                         |

### Admin (staff/admin only — layout enforces `requireStaff()`)

`/admin` (dashboard) · `/admin/orders`, `/admin/orders/[id]` · `/admin/products`, `/admin/products/new`, `/admin/products/[id]` · `/admin/categories` · `/admin/partners`, `/admin/partners/[id]` · `/admin/gift-cards`, `/admin/gift-cards/[id]` · `/admin/destinations` (countries, cities, zones, fees, scheduling) · `/admin/occasions` · `/admin/audit` · `/admin/settings`

### API / Route Handlers

| Route                                    | Purpose                                                               |
| ---------------------------------------- | --------------------------------------------------------------------- |
| `POST /api/payments/demo/confirm`        | Demo-only; 404 unless `PAYMENTS_DEMO_ENABLED=true` and not production |
| `POST /api/webhooks/payments/[provider]` | Reserved; provider-specific signature verification                    |
| `GET /api/health`                        | Build/health check                                                    |

Most mutations use **Server Actions** rather than REST, keeping validation and authorization colocated.

---

## 5. Proposed database model

Conventions: `uuid` PKs (`gen_random_uuid()`), `created_at`/`updated_at timestamptz`, `snake_case`, soft-delete via `archived_at` where useful. Money columns are `bigint` minor units with a sibling `*_currency char(3)` referencing `currencies`.

### 5.1 Enums

```
user_role:               customer | staff | admin
product_type:            physical | gift_card
product_status:          draft | active | archived
gc_fulfillment_method:   digital_code | physical_card | manual
order_status:            pending_payment | confirmed | processing | partially_fulfilled | fulfilled | cancelled | refunded
payment_mode:            demo | manual | live
payment_status:          unpaid | pending | authorized | paid | failed | refunded | partially_refunded
item_fulfillment_status: pending | scheduled | in_progress | delivered | issued | failed | cancelled
partner_status:          draft | active | suspended
```

### 5.2 Tables

**Identity & roles**

- `profiles` — `id (FK auth.users)`, `role user_role default 'customer'`, `full_name`, `phone`, `home_country_code`, `preferred_currency`. Role is only writable by admin (RLS + trigger guard).
- `admin_audit_log` — `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `before jsonb`, `after jsonb`, `ip`, `created_at`. Insert-only; service-role writes.

**Geography & money**

- `currencies` — `code char(3) PK`, `name`, `minor_unit_exponent smallint`, `symbol`, `is_charge_currency bool` (can customers be charged in it), `is_face_currency bool` (can gift cards be denominated in it).
- `countries` — `code char(2) PK`, `name`, `is_destination bool`, `is_origin bool` (where customers order from), `default_timezone`, `is_active`.
- `cities` — `id`, `country_code FK`, `name`, `slug`, `timezone`, `is_active`, `sort_order`. (Demo: Damascus, Baghdad.)
- `delivery_zones` — `id`, `city_id FK`, `name`, `is_active`.
- `delivery_fees` — `id`, `zone_id FK`, `applies_to product_type[]`, `fee_minor bigint`, `currency`, `free_above_minor nullable`.
- `delivery_settings` — `id`, `city_id FK`, `min_lead_days`, `max_advance_days`, `cutoff_time time`, `blackout_dates date[]`, `delivery_days smallint[]` (0–6).

**Catalog**

- `categories` — `id`, `slug`, `name`, `description`, `image_path`, `product_type` (physical | gift_card), `sort_order`, `is_active`.
- `occasions` — `id`, `slug`, `name`, `description`, `image_path`, `is_active`.
- `partners` — `id`, `slug`, `name`, `description`, `logo_path`, `store_category` (supermarket | department | grocery | other), `country_code`, `status partner_status`, `is_demo bool default true`, `contact_notes` (private), `supported_fulfillment_methods gc_fulfillment_method[]`.
- `partner_locations` — `id`, `partner_id`, `city_id`, `label`, `address`, `is_active`.
- `products` — `id`, `slug`, `product_type`, `category_id`, `partner_id nullable` (required when gift_card), `name`, `short_description`, `description`, `status`, `is_featured`, `is_demo bool default true`, `base_price_minor`, `currency` (charge currency), `lead_time_days_override nullable`, `metadata jsonb`.
- `product_images` — `id`, `product_id`, `storage_path`, `alt`, `sort_order`.
- `product_variants` — `id`, `product_id`, `name` (e.g. "Medium bouquet", "1 kg"), `sku`, `price_minor`, `currency`, `is_default`, `is_active`, `option_values jsonb`.
- `product_occasions` — `(product_id, occasion_id)`.
- `product_availability` — `(product_id, city_id) PK`, `is_available`, `lead_time_days nullable`, `stock_note`. **A product is purchasable for a city only if a row exists with `is_available = true`.**
- `gift_card_products` — `product_id PK/FK`, `face_currency`, `default_fulfillment_method gc_fulfillment_method default 'manual'`, `allowed_fulfillment_methods gc_fulfillment_method[]` (⊆ partner's), `redemption_instructions text`, `terms text`, `terms_version int`, `expiry_months nullable`, `restrictions text`, `delivery_timing_note text`, `accepted_location_ids uuid[]` (or join table—decided in Stage 3 as join table `gift_card_accepted_locations`).
- `gift_card_denominations` — `id`, `product_id`, `face_value_minor`, `face_currency`, `charge_price_minor`, `charge_currency`, `is_active`, `sort_order`. Face and charge are stored separately and shown separately; no conversion is computed.

**Cart (persisted for signed-in users; guests use local storage)**

- `carts` — `id`, `user_id nullable unique`, `destination_city_id`, `updated_at`.
- `cart_items` — `id`, `cart_id`, `product_id`, `variant_id nullable`, `denomination_id nullable`, `quantity`, `gift_message`.

**Orders**

- `orders` — `id`, `order_number text unique` (human-friendly, e.g. `EV-2026-00042`), `user_id nullable`, `guest_email`, `guest_access_token_hash`, `idempotency_key text unique`, `status order_status`, `origin_country_code`, `destination_country_code`, `destination_city_id`, `delivery_date date`, `delivery_timezone`, `delivery_zone_id`, `sender_name`, `sender_email`, `sender_phone`, `gift_message`, `subtotal_minor`, `delivery_fee_minor`, `total_minor`, `currency`, `contains_physical bool`, `contains_digital bool`, `support_notes text` (staff-only), `placed_at`, `cancelled_at`.
- `order_recipients` — `order_id PK/FK`, `name`, `phone`, `email`, `address_line1`, `address_line2`, `landmark`, `city_id`, `notes`. Address fields nullable (not required for digital-only).
- `order_items` — `id`, `order_id`, `product_id`, `variant_id`, `denomination_id`, `product_type`, `quantity`, `unit_price_minor`, `line_total_minor`, `currency`, `snapshot jsonb` (name, variant label, image, partner name, face value + face currency, fulfillment method, redemption instructions, terms text + version, expiry), `fulfillment_status item_fulfillment_status`, `fulfillment_method gc_fulfillment_method nullable`.
- `order_status_history` — `id`, `order_id`, `from_status`, `to_status`, `actor_id nullable`, `note`, `created_at`.
- `payments` — `id`, `order_id`, `provider text`, `mode payment_mode`, `status payment_status`, `amount_minor`, `currency`, `provider_reference`, `provider_payload jsonb` (sanitised; never card data), `confirmed_by uuid nullable` (admin for manual), `created_at`, `updated_at`. Multiple rows per order allowed (retries, refunds).
- `item_fulfillments` — `id`, `order_item_id`, `status`, `method`, `assigned_to uuid`, `scheduled_for`, `completed_at`, `note`, `created_at`. Non-secret operational record.
- `gift_card_fulfillments_secure` — `id`, `order_item_id unique`, `code_encrypted bytea`, `pin_encrypted bytea`, `serial_last4`, `issued_by uuid`, `issued_at`, `source text` (e.g. "partner batch #", "manual"), `revealed_count int`, `last_revealed_at`. **No RLS select policy for customers or staff via PostgREST; read only by SECURITY DEFINER function `reveal_gift_card(order_item_id)` that checks entitlement (order owner, or admin) and writes an audit row.** Encryption via `pgsodium`/Vault if available on the plan, else app-level AES-GCM with a server-only key (decided in Stage 3).
- `order_support_notes` — `id`, `order_id`, `author_id`, `body`, `created_at`. Staff-only.

### 5.3 Key functions (Stage 3)

- `is_admin()`, `is_staff()` — stable SQL helpers used in RLS, reading `profiles.role`.
- `create_order(payload jsonb, idempotency_key text)` — SECURITY DEFINER; recomputes prices, availability, fees, compatibility; inserts order, recipient, items, initial payment row, status history; returns order number + guest token. All-or-nothing.
- `next_order_number()` — sequence-backed.
- `reveal_gift_card(order_item_id)` — entitlement-checked reveal with audit.
- `mark_payment_received(order_id, note)` — admin-only manual payment path.

### 5.4 RLS summary

| Table group                                                                                                                                                                                        | anon                                  | customer                            | staff/admin                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------- | -------------------------------------------- |
| currencies, countries, cities, zones, fees, settings, categories, occasions, active products/variants/images/availability, active partners (public fields), gift-card public fields, denominations | read                                  | read                                | all                                          |
| profiles                                                                                                                                                                                           | —                                     | own row (role column not updatable) | all                                          |
| carts/cart_items                                                                                                                                                                                   | —                                     | own                                 | —                                            |
| orders, order_items, order_recipients, payments, status history                                                                                                                                    | — (guest access via function + token) | own (`user_id = auth.uid()`)        | all                                          |
| item_fulfillments, order_support_notes, admin_audit_log, partner private fields                                                                                                                    | —                                     | —                                   | staff read / admin write (audit insert-only) |
| gift_card_fulfillments_secure                                                                                                                                                                      | —                                     | — (function only)                   | admin via function only                      |

Public catalog responses never include `partner.contact_notes`, `orders.support_notes`, recipient rows, or anything from the secure table.

---

## 6. Key decisions & defaults (reversible unless noted)

| #   | Decision                   | Default chosen                                                                                                                                                                                                                    |
| --- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Storefront charge currency | **USD** for all demo products and gift-card charge prices. Multi-currency charging is structurally supported (per-product currency) but one currency per order is enforced.                                                       |
| 2   | Gift-card face currencies  | **SYP** for Syria demo partners, **IQD** for Iraq demo partners, shown separately from the USD charge price with no conversion claimed.                                                                                           |
| 3   | Gift-card fulfillment      | **Manual** by default; `digital_code` and `physical_card` exist as configuration but no code generation—codes only entered by admin from an authorised source.                                                                    |
| 4   | Guest order access         | Confirmation/tracking link carries a random token (hashed in DB). Public `/track` with only an order number shows coarse status and no PII.                                                                                       |
| 5   | Cart storage               | Local storage for guests; synced to `carts` on sign-in. Cart is never authoritative—checkout re-prices everything.                                                                                                                |
| 6   | Delivery dates             | Computed in the **destination city's timezone** using `delivery_settings` (lead days, cutoff, blackout, allowed weekdays). Stored as `date` + `timezone`.                                                                         |
| 7   | Cart compatibility         | One order = one country, one city, one recipient, one date. Physical + digital may mix if the destination city supports both; otherwise checkout explains and offers to split.                                                    |
| 8   | Auth                       | Email/password + magic link via Supabase Auth. Admins promoted by SQL/seed only in MVP.                                                                                                                                           |
| 9   | Images                     | Supabase Storage bucket `product-images` (public read, admin write via signed upload); demo images from `/public/demo`.                                                                                                           |
| 10  | Demo payment safety        | `DemoPaymentProvider` registered only when `PAYMENTS_DEMO_ENABLED=true` **and** `NODE_ENV !== 'production'`. Payments it creates carry `mode = 'demo'` and the order confirmation shows a "Demo payment — no money moved" banner. |

---

## 7. Unresolved launch requirements (blocking real transactions)

These must be resolved with qualified professionals/providers before Giftivana processes real orders. The app will display a non-dismissable "demo environment" notice until an admin setting is flipped after these are cleared.

1. **Payment processor availability** — a provider that will onboard a business selling into Syria and Iraq, with acceptable settlement and chargeback terms.
2. **Sanctions and export-control compliance** — legal review of OFAC/EU/UK regimes and any licence requirements for the business model, product categories, and partner payments.
3. **Cross-border commerce & tax** — VAT/sales tax, consumer-protection rules in origin countries, and terms of sale.
4. **Gift-card partner authorisation** — written agreements with each store covering issuance, redemption, liability, expiry, and reconciliation; no gift card may be listed as redeemable without one.
5. **Local fulfillment partners** — florists, bakeries, couriers per city; delivery coverage claims must come from these agreements.
6. **Data protection** — privacy policy, data-residency, and retention rules for recipient PII in each jurisdiction.
7. **Legal text** — Terms, Privacy, and Gift-Card Terms are placeholders requiring counsel review.

---

## 8. Questions (answer any; sensible defaults are already applied)

1. **Charge currency:** Is USD the right single currency to charge customers in for the MVP? (Default: yes.)
2. **Supabase project:** The Supabase connector is available in this session. Should I create a new project in your organisation at Stage 3 (it may incur cost—I'll confirm first), or will you supply an existing project's URL and keys?
3. **GitHub:** Should I create the `giftivana` repository and push milestone commits via the GitHub connector, or do you prefer to create it and give me the name?
4. **Gift-card secrets:** When a real partner supplies codes, do you want them stored encrypted in the database (revealable to the entitled customer in their account), or kept out of the database entirely and delivered only by your team by hand? (Default: encrypted storage with audited reveal, since it enables the customer flow.)
5. **Origin markets:** Which customer countries should appear first in the "ordering from" selector? (Default: US, UK, Germany, Sweden, Canada, Australia, UAE—editable in admin.)

---

## 9. Next checkpoint

**Stage 2** scaffolds the Next.js project with pinned dependencies, the design-token system, and the responsive homepage, catalog, product, gift-card catalog and detail pages driven by typed demo data (`src/data/demo.ts`) that mirrors the schema above, so Stage 3 can swap the data source for Supabase queries without changing components.
