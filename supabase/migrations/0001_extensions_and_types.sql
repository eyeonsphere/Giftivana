-- 0001: extensions and enum types
-- All enums are created once here; later migrations reference them.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'staff', 'admin');
create type public.product_type as enum ('physical', 'gift_card');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.gc_fulfillment_method as enum ('digital_code', 'physical_card', 'manual');
create type public.partner_status as enum ('draft', 'active', 'suspended');
create type public.store_category as enum ('supermarket', 'department', 'grocery', 'other');
create type public.order_status as enum ('pending_payment', 'confirmed', 'processing', 'partially_fulfilled', 'fulfilled', 'cancelled', 'refunded');
create type public.payment_mode as enum ('demo', 'manual', 'live');
create type public.payment_status as enum ('unpaid', 'pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded');
create type public.item_fulfillment_status as enum ('pending', 'scheduled', 'in_progress', 'delivered', 'issued', 'failed', 'cancelled');

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
