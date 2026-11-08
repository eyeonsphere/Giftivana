-- 0005: fulfillment records, secure gift-card data, support notes, audit log.

create table public.item_fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  status public.item_fulfillment_status not null default 'pending',
  method public.gc_fulfillment_method,
  assigned_to uuid references auth.users (id) on delete set null,
  scheduled_for date,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
create index item_fulfillments_item_idx on public.item_fulfillments (order_item_id, created_at desc);

-- SECURE: gift-card codes. No PostgREST policies are ever added for this table.
-- Reads happen only through reveal_gift_card() (0006), which checks entitlement and audits.
-- Values are encrypted with pgcrypto using a key held in Vault / an app secret, never stored here.
create table public.gift_card_fulfillments_secure (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references public.order_items (id) on delete cascade,
  code_encrypted bytea,
  pin_encrypted bytea,
  serial_last4 text,
  issued_by uuid references auth.users (id) on delete set null,
  issued_at timestamptz not null default now(),
  source text not null default 'manual', -- e.g. "partner batch 2026-11", "manual"
  revealed_count int not null default 0,
  last_revealed_at timestamptz
);

create table public.order_support_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index order_support_notes_order_idx on public.order_support_notes (order_id, created_at);

-- Append-only audit log for administrative actions.
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  ip inet,
  created_at timestamptz not null default now()
);
create index admin_audit_log_entity_idx on public.admin_audit_log (entity_type, entity_id, created_at desc);

create or replace function public.audit(p_action text, p_entity_type text, p_entity_id text, p_before jsonb default null, p_after jsonb default null)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, before, after)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_before, p_after);
$$;

-- Block updates/deletes on the audit log at the database level, even for the service role.
create or replace function public.audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'admin_audit_log is append-only' using errcode = '42501';
end;
$$;
create trigger admin_audit_log_no_update before update or delete on public.admin_audit_log for each row execute function public.audit_log_immutable();

-- Storage bucket for product images: public read, admin write (policies in 0007).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
