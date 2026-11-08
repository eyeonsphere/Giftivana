-- 0004: carts, orders, recipients, items, status history, payments.
-- Orders are PRIVATE: customer-owned or staff-visible. Guests reach their own order
-- only through a hashed access token (see 0006 functions).

-- ---------- Carts (signed-in users only; guests use local storage) ----------
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  destination_city_id uuid references public.cities (id),
  updated_at timestamptz not null default now()
);
create trigger carts_updated_at before update on public.carts for each row execute function public.set_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  denomination_id uuid references public.gift_card_denominations (id) on delete set null,
  quantity int not null check (quantity between 1 and 10),
  gift_message text not null default '' check (char_length(gift_message) <= 300),
  created_at timestamptz not null default now()
);
create index cart_items_cart_idx on public.cart_items (cart_id);

-- ---------- Orders ----------
create sequence public.order_number_seq;

create or replace function public.next_order_number()
returns text
language sql
volatile
as $$
  select 'EV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
$$;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default public.next_order_number(),
  user_id uuid references auth.users (id) on delete set null,
  guest_email text,
  guest_access_token_hash text, -- sha256 hex of a random token; never the token itself
  idempotency_key text not null unique,
  status public.order_status not null default 'pending_payment',
  origin_country_code char(2) references public.countries (code),
  destination_country_code char(2) not null references public.countries (code),
  destination_city_id uuid not null references public.cities (id),
  delivery_zone_id uuid references public.delivery_zones (id),
  delivery_date date not null,
  delivery_timezone text not null,
  sender_name text not null,
  sender_email text not null,
  sender_phone text,
  gift_message text not null default '',
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  delivery_fee_minor bigint not null default 0 check (delivery_fee_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  currency char(3) not null references public.currencies (code),
  contains_physical boolean not null default false,
  contains_digital boolean not null default false,
  placed_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_owner_or_guest check (user_id is not null or guest_email is not null)
);
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create index orders_user_idx on public.orders (user_id, placed_at desc);
create index orders_status_idx on public.orders (status, placed_at desc);
create index orders_delivery_idx on public.orders (destination_city_id, delivery_date);

-- Recipient PII lives in its own table so list queries never touch it.
create table public.order_recipients (
  order_id uuid primary key references public.orders (id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  address_line1 text,
  address_line2 text,
  landmark text,
  city_id uuid references public.cities (id),
  notes text
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  denomination_id uuid references public.gift_card_denominations (id) on delete set null,
  product_type public.product_type not null,
  quantity int not null check (quantity between 1 and 10),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  line_total_minor bigint not null check (line_total_minor >= 0),
  currency char(3) not null references public.currencies (code),
  snapshot jsonb not null default '{}', -- name, variant, image, partner, face value, terms, etc. at purchase time
  fulfillment_method public.gc_fulfillment_method,
  fulfillment_status public.item_fulfillment_status not null default 'pending',
  gift_message text not null default '',
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  actor_id uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- ---------- Payments ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null, -- 'demo' | 'manual' | a real provider key later
  mode public.payment_mode not null,
  status public.payment_status not null default 'unpaid',
  amount_minor bigint not null check (amount_minor >= 0),
  currency char(3) not null references public.currencies (code),
  provider_reference text,
  provider_payload jsonb not null default '{}', -- sanitised; never card data
  confirmed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A demo payment can never be created in live mode and vice versa.
  constraint payments_mode_matches_provider check (
    (provider = 'demo' and mode = 'demo') or (provider = 'manual' and mode = 'manual') or (provider not in ('demo', 'manual') and mode = 'live')
  )
);
create trigger payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
create index payments_order_idx on public.payments (order_id);
