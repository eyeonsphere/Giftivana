-- 0003: catalog — categories, occasions, partners, products, variants, images,
-- availability, gift-card details and denominations.
-- Everything here is PUBLIC catalog data except partners.contact_notes.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  product_type public.product_type not null default 'physical',
  image_path text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.occasions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  image_path text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  logo_path text,
  store_category public.store_category not null default 'other',
  country_code char(2) not null references public.countries (code),
  status public.partner_status not null default 'draft',
  is_demo boolean not null default true,
  supported_fulfillment_methods public.gc_fulfillment_method[] not null default '{manual}',
  contact_notes text, -- PRIVATE: staff only, never selected by the public view
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger partners_updated_at before update on public.partners for each row execute function public.set_updated_at();

-- Public projection of partners. The storefront reads this, never the base table.
create view public.partners_public
with (security_invoker = true)
as
  select id, slug, name, description, logo_path, store_category, country_code, status, is_demo, supported_fulfillment_methods
  from public.partners
  where status = 'active';

create table public.partner_locations (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners (id) on delete cascade,
  city_id uuid not null references public.cities (id),
  label text not null,
  address text,
  is_active boolean not null default true
);
create index partner_locations_partner_idx on public.partner_locations (partner_id);
create index partner_locations_city_idx on public.partner_locations (city_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  product_type public.product_type not null default 'physical',
  category_id uuid not null references public.categories (id),
  partner_id uuid references public.partners (id),
  name text not null,
  short_description text not null default '',
  description text not null default '',
  status public.product_status not null default 'draft',
  is_featured boolean not null default false,
  is_demo boolean not null default true,
  base_price_minor bigint not null check (base_price_minor >= 0),
  currency char(3) not null references public.currencies (code),
  lead_time_days_override int,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_gift_card_needs_partner check (product_type <> 'gift_card' or partner_id is not null)
);
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create index products_type_status_idx on public.products (product_type, status);
create index products_category_idx on public.products (category_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt text not null default '',
  sort_order int not null default 0
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  sku text,
  price_minor bigint not null check (price_minor >= 0),
  currency char(3) not null references public.currencies (code),
  is_default boolean not null default false,
  is_active boolean not null default true,
  option_values jsonb not null default '{}',
  sort_order int not null default 0
);
create index product_variants_product_idx on public.product_variants (product_id);

create table public.product_occasions (
  product_id uuid not null references public.products (id) on delete cascade,
  occasion_id uuid not null references public.occasions (id) on delete cascade,
  primary key (product_id, occasion_id)
);

-- A product is purchasable in a city only if a row exists here with is_available = true.
create table public.product_availability (
  product_id uuid not null references public.products (id) on delete cascade,
  city_id uuid not null references public.cities (id) on delete cascade,
  is_available boolean not null default true,
  lead_time_days int check (lead_time_days is null or lead_time_days >= 0),
  stock_note text,
  primary key (product_id, city_id)
);
create index product_availability_city_idx on public.product_availability (city_id) where is_available;

create table public.gift_card_products (
  product_id uuid primary key references public.products (id) on delete cascade,
  face_currency char(3) not null references public.currencies (code),
  default_fulfillment_method public.gc_fulfillment_method not null default 'manual',
  allowed_fulfillment_methods public.gc_fulfillment_method[] not null default '{manual}',
  redemption_instructions text not null default '',
  terms text not null default '',
  terms_version int not null default 1,
  expiry_months int check (expiry_months is null or expiry_months > 0),
  restrictions text not null default '',
  delivery_timing_note text not null default '',
  constraint gift_card_default_in_allowed check (default_fulfillment_method = any (allowed_fulfillment_methods))
);

create table public.gift_card_accepted_locations (
  product_id uuid not null references public.gift_card_products (product_id) on delete cascade,
  location_id uuid not null references public.partner_locations (id) on delete cascade,
  primary key (product_id, location_id)
);

create table public.gift_card_denominations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.gift_card_products (product_id) on delete cascade,
  face_value_minor bigint not null check (face_value_minor > 0),
  face_currency char(3) not null references public.currencies (code),
  charge_price_minor bigint not null check (charge_price_minor > 0),
  charge_currency char(3) not null references public.currencies (code),
  is_active boolean not null default true,
  sort_order int not null default 0
);
create index gift_card_denominations_product_idx on public.gift_card_denominations (product_id);

-- Guard: a gift card's allowed methods must be a subset of its partner's supported methods.
create or replace function public.guard_gift_card_methods()
returns trigger
language plpgsql
as $$
declare
  partner_methods public.gc_fulfillment_method[];
begin
  select p.supported_fulfillment_methods into partner_methods
  from public.products pr join public.partners p on p.id = pr.partner_id
  where pr.id = new.product_id;
  if partner_methods is null then
    raise exception 'Gift card product % has no partner', new.product_id;
  end if;
  if not (new.allowed_fulfillment_methods <@ partner_methods) then
    raise exception 'allowed_fulfillment_methods must be a subset of the partner''s supported methods';
  end if;
  return new;
end;
$$;
create trigger gift_card_products_guard_methods
  before insert or update on public.gift_card_products
  for each row execute function public.guard_gift_card_methods();
