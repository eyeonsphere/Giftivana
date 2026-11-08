-- 0002: identity, money, geography, delivery

-- ---------- Profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text,
  phone text,
  home_country_code char(2),
  preferred_currency char(3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- Create a profile row automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helpers used by RLS. STABLE + security definer so they can read profiles regardless of RLS.
create or replace function public.current_role_of_user()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'customer'::public.user_role);
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_of_user() in ('staff', 'admin');
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_of_user() = 'admin';
$$;

-- Prevent non-admins from changing their own role (defence in depth beside RLS).
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger profiles_guard_role before update on public.profiles for each row execute function public.guard_profile_role();

-- ---------- Money ----------
create table public.currencies (
  code char(3) primary key,
  name text not null,
  minor_unit_exponent smallint not null check (minor_unit_exponent between 0 and 4),
  symbol text,
  is_charge_currency boolean not null default false,
  is_face_currency boolean not null default false
);

-- ---------- Geography ----------
create table public.countries (
  code char(2) primary key,
  name text not null,
  is_destination boolean not null default false,
  is_origin boolean not null default false,
  default_timezone text not null,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references public.countries (code),
  name text not null,
  slug text not null unique,
  timezone text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index cities_country_idx on public.cities (country_code, sort_order);

-- ---------- Delivery ----------
create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  is_active boolean not null default true
);
create index delivery_zones_city_idx on public.delivery_zones (city_id);

create table public.delivery_fees (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.delivery_zones (id) on delete cascade,
  applies_to public.product_type[] not null default '{physical}',
  fee_minor bigint not null check (fee_minor >= 0),
  currency char(3) not null references public.currencies (code),
  free_above_minor bigint check (free_above_minor is null or free_above_minor >= 0),
  is_active boolean not null default true
);
create index delivery_fees_zone_idx on public.delivery_fees (zone_id);

create table public.delivery_settings (
  city_id uuid primary key references public.cities (id) on delete cascade,
  min_lead_days int not null default 2 check (min_lead_days >= 0),
  max_advance_days int not null default 45 check (max_advance_days > 0),
  cutoff_time time not null default '14:00',
  blackout_dates date[] not null default '{}',
  delivery_days smallint[] not null default '{0,1,2,3,4,5,6}'
);
