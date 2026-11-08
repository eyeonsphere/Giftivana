-- 0007: Row Level Security policies.
--
-- Principles:
--   • Catalog data is publicly readable (anon + authenticated).
--   • Profiles, carts and cart items are own-row only.
--   • Orders and related tables are visible to the owner or any staff member.
--   • The partners base table and fulfillment/audit tables are staff/admin only.
--   • gift_card_fulfillments_secure has NO policies — accessed only via
--     security-definer functions that check entitlement and audit.
--
-- Helper functions used below (created in earlier migrations):
--   public.is_staff()  — true for staff or admin
--   public.is_admin()  — true for admin only

-- ============================================================================
-- 1. Enable RLS on every table (views excluded — partners_public uses
--    security_invoker and inherits the base table's policies).
-- ============================================================================

alter table public.currencies                   enable row level security;
alter table public.countries                     enable row level security;
alter table public.cities                        enable row level security;
alter table public.delivery_zones                enable row level security;
alter table public.delivery_fees                 enable row level security;
alter table public.delivery_settings             enable row level security;
alter table public.categories                    enable row level security;
alter table public.occasions                     enable row level security;
alter table public.partners                      enable row level security;
alter table public.partner_locations             enable row level security;
alter table public.products                      enable row level security;
alter table public.product_images                enable row level security;
alter table public.product_variants              enable row level security;
alter table public.product_occasions             enable row level security;
alter table public.product_availability          enable row level security;
alter table public.gift_card_products            enable row level security;
alter table public.gift_card_accepted_locations  enable row level security;
alter table public.gift_card_denominations       enable row level security;
alter table public.profiles                      enable row level security;
alter table public.carts                         enable row level security;
alter table public.cart_items                    enable row level security;
alter table public.orders                        enable row level security;
alter table public.order_recipients              enable row level security;
alter table public.order_items                   enable row level security;
alter table public.order_status_history          enable row level security;
alter table public.payments                      enable row level security;
alter table public.item_fulfillments             enable row level security;
alter table public.order_support_notes           enable row level security;
alter table public.gift_card_fulfillments_secure enable row level security;
alter table public.admin_audit_log               enable row level security;

-- ============================================================================
-- 2. Public catalog — SELECT for anon + authenticated
-- ============================================================================

-- Reference data (no row-level filter needed)
create policy currencies_public_read       on public.currencies          for select using (true);
create policy countries_public_read        on public.countries           for select using (true);
create policy cities_public_read           on public.cities              for select using (true);
create policy delivery_settings_public_read on public.delivery_settings  for select using (true);

-- Catalog with active filter
create policy categories_public_read       on public.categories          for select using (is_active);
create policy occasions_public_read        on public.occasions           for select using (is_active);
create policy products_public_read         on public.products            for select using (status = 'active');
create policy product_variants_public_read on public.product_variants    for select using (is_active);
create policy delivery_zones_public_read   on public.delivery_zones      for select using (is_active);
create policy delivery_fees_public_read    on public.delivery_fees       for select using (is_active);
create policy partner_locations_public_read on public.partner_locations  for select using (is_active);
create policy product_availability_public_read on public.product_availability for select using (is_available);
create policy gift_card_denominations_public_read on public.gift_card_denominations for select using (is_active);

-- Join / detail tables (no row-level filter — reachable only through active parents)
create policy product_images_public_read   on public.product_images             for select using (true);
create policy product_occasions_public_read on public.product_occasions         for select using (true);
create policy gift_card_products_public_read on public.gift_card_products       for select using (true);
create policy gift_card_accepted_locations_public_read on public.gift_card_accepted_locations for select using (true);

-- Partners base table: staff/admin only for writes; the public view
-- (partners_public, security_invoker) handles storefront reads. Since
-- security_invoker = true the view runs as the caller, so the caller needs
-- a SELECT policy on the base table. We grant it only for active partners.
create policy partners_public_read         on public.partners for select using (status = 'active');
create policy partners_staff_all           on public.partners for all   using (public.is_staff()) with check (public.is_staff());

-- ============================================================================
-- 3. Own-row: profiles
-- ============================================================================

create policy profiles_own_select on public.profiles for select using (id = auth.uid());
create policy profiles_own_insert on public.profiles for insert with check (id = auth.uid());
create policy profiles_own_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- Staff can read any profile (for admin views)
create policy profiles_staff_select on public.profiles for select using (public.is_staff());

-- ============================================================================
-- 4. Own-row: carts and cart items
-- ============================================================================

create policy carts_own_select on public.carts for select using (user_id = auth.uid());
create policy carts_own_insert on public.carts for insert with check (user_id = auth.uid());
create policy carts_own_update on public.carts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy carts_own_delete on public.carts for delete using (user_id = auth.uid());

create policy cart_items_own_select on public.cart_items for select
  using (cart_id in (select id from public.carts where user_id = auth.uid()));
create policy cart_items_own_insert on public.cart_items for insert
  with check (cart_id in (select id from public.carts where user_id = auth.uid()));
create policy cart_items_own_update on public.cart_items for update
  using (cart_id in (select id from public.carts where user_id = auth.uid()))
  with check (cart_id in (select id from public.carts where user_id = auth.uid()));
create policy cart_items_own_delete on public.cart_items for delete
  using (cart_id in (select id from public.carts where user_id = auth.uid()));

-- ============================================================================
-- 5. Orders: owner or staff
-- ============================================================================

create policy orders_owner_or_staff on public.orders for select
  using (user_id = auth.uid() or public.is_staff());

create policy order_recipients_owner_or_staff on public.order_recipients for select
  using (order_id in (select id from public.orders where user_id = auth.uid() or public.is_staff()));

create policy order_items_owner_or_staff on public.order_items for select
  using (order_id in (select id from public.orders where user_id = auth.uid() or public.is_staff()));

create policy order_status_history_owner_or_staff on public.order_status_history for select
  using (order_id in (select id from public.orders where user_id = auth.uid() or public.is_staff()));

create policy payments_owner_or_staff on public.payments for select
  using (order_id in (select id from public.orders where user_id = auth.uid() or public.is_staff()));

-- Staff can write to orders and related tables (status changes, fulfillment, etc.)
create policy orders_staff_update on public.orders for update
  using (public.is_staff()) with check (public.is_staff());
create policy order_items_staff_update on public.order_items for update
  using (public.is_staff()) with check (public.is_staff());
create policy payments_staff_update on public.payments for update
  using (public.is_staff()) with check (public.is_staff());
-- Order insert is done by the service role (checkout); no RLS INSERT needed for authenticated.

-- ============================================================================
-- 6. Staff/admin only
-- ============================================================================

-- Item fulfillments: staff can read, insert, update
create policy item_fulfillments_staff_select on public.item_fulfillments for select using (public.is_staff());
create policy item_fulfillments_staff_insert on public.item_fulfillments for insert with check (public.is_staff());
create policy item_fulfillments_staff_update on public.item_fulfillments for update using (public.is_staff()) with check (public.is_staff());

-- Order support notes: staff can read and insert
create policy order_support_notes_staff_select on public.order_support_notes for select using (public.is_staff());
create policy order_support_notes_staff_insert on public.order_support_notes for insert with check (public.is_staff());

-- gift_card_fulfillments_secure: NO policies. RLS is enabled (denies all by
-- default) and access is exclusively through security-definer functions
-- reveal_gift_card() and issue_gift_card() which check entitlement and audit.

-- Admin audit log: append via security-definer audit(), read for admins only.
-- The audit() function is SECURITY DEFINER so it bypasses RLS for INSERT.
-- We still add an INSERT policy for defence-in-depth (authenticated only).
create policy audit_log_authenticated_insert on public.admin_audit_log for insert
  with check (auth.uid() is not null);
create policy audit_log_admin_select on public.admin_audit_log for select
  using (public.is_admin());
