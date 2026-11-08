-- 0006: access functions.
-- create_order() arrives in Stage 4 (0008) together with the checkout that exercises it.

-- ---------- Guest order access ----------
-- A guest's confirmation link carries a random token. We store only sha256(token).
-- This function returns the order id if the (order_number, token) pair matches.
create or replace function public.resolve_guest_order(p_order_number text, p_token text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.orders
  where order_number = p_order_number
    and guest_access_token_hash is not null
    and guest_access_token_hash = encode(digest(p_token, 'sha256'), 'hex');
$$;

-- ---------- Entitlement: may the caller see this order in full? ----------
create or replace function public.can_access_order(p_order_id uuid, p_token text default null)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  o record;
begin
  select user_id, order_number into o from public.orders where id = p_order_id;
  if not found then return false; end if;
  if public.is_staff() then return true; end if;
  if auth.uid() is not null and o.user_id = auth.uid() then return true; end if;
  if p_token is not null and public.resolve_guest_order(o.order_number, p_token) = p_order_id then return true; end if;
  return false;
end;
$$;

-- ---------- Secure gift-card reveal ----------
-- The ONLY read path for gift_card_fulfillments_secure. Decrypts with a key passed
-- by the server (from a server-only secret), checks entitlement, and audits the reveal.
create or replace function public.reveal_gift_card(p_order_item_id uuid, p_key text, p_token text default null)
returns table (code text, pin text, serial_last4 text, issued_at timestamptz)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  select order_id into v_order_id from public.order_items where id = p_order_item_id;
  if v_order_id is null or not public.can_access_order(v_order_id, p_token) then
    raise exception 'Not entitled to this item' using errcode = '42501';
  end if;

  update public.gift_card_fulfillments_secure
     set revealed_count = revealed_count + 1, last_revealed_at = now()
   where order_item_id = p_order_item_id;

  perform public.audit('gift_card.reveal', 'order_item', p_order_item_id::text);

  return query
    select
      case when s.code_encrypted is null then null else pgp_sym_decrypt(s.code_encrypted, p_key) end,
      case when s.pin_encrypted is null then null else pgp_sym_decrypt(s.pin_encrypted, p_key) end,
      s.serial_last4,
      s.issued_at
    from public.gift_card_fulfillments_secure s
    where s.order_item_id = p_order_item_id;
end;
$$;

-- Admin-only write path for gift-card secrets. Never generates codes: the caller supplies
-- one obtained from the partner / an authorised process.
create or replace function public.issue_gift_card(p_order_item_id uuid, p_code text, p_pin text, p_source text, p_key text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  if p_code is null or length(trim(p_code)) < 4 then
    raise exception 'A real code from the partner is required';
  end if;

  insert into public.gift_card_fulfillments_secure (order_item_id, code_encrypted, pin_encrypted, serial_last4, issued_by, source)
  values (
    p_order_item_id,
    pgp_sym_encrypt(p_code, p_key),
    case when p_pin is null then null else pgp_sym_encrypt(p_pin, p_key) end,
    right(p_code, 4),
    auth.uid(),
    coalesce(p_source, 'manual')
  )
  on conflict (order_item_id) do update
    set code_encrypted = excluded.code_encrypted,
        pin_encrypted = excluded.pin_encrypted,
        serial_last4 = excluded.serial_last4,
        issued_by = excluded.issued_by,
        issued_at = now(),
        source = excluded.source;

  update public.order_items set fulfillment_status = 'issued' where id = p_order_item_id;
  perform public.audit('gift_card.issue', 'order_item', p_order_item_id::text, null, jsonb_build_object('source', p_source));
end;
$$;

-- ---------- Manual payment confirmation ----------
create or replace function public.mark_payment_received(p_order_id uuid, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_old public.order_status;
begin
  if not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  select status into v_old from public.orders where id = p_order_id for update;
  if v_old is null then raise exception 'Order not found'; end if;

  update public.payments
     set status = 'paid', confirmed_by = auth.uid(), provider_reference = coalesce(provider_reference, 'manual')
   where order_id = p_order_id and mode = 'manual' and status in ('unpaid', 'pending');

  if v_old = 'pending_payment' then
    update public.orders set status = 'confirmed' where id = p_order_id;
    insert into public.order_status_history (order_id, from_status, to_status, actor_id, note)
    values (p_order_id, v_old, 'confirmed', auth.uid(), coalesce(p_note, 'Payment received (manual)'));
  end if;

  perform public.audit('payment.mark_received', 'order', p_order_id::text, jsonb_build_object('status', v_old), jsonb_build_object('note', p_note));
end;
$$;

-- Lock down execution: these functions are callable by authenticated users and
-- the service role only where appropriate.
revoke execute on function public.reveal_gift_card(uuid, text, text) from public, anon;
revoke execute on function public.issue_gift_card(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.mark_payment_received(uuid, text) from public, anon, authenticated;
revoke execute on function public.audit(text, text, text, jsonb, jsonb) from public, anon, authenticated;
-- resolve_guest_order and can_access_order are needed by the server (service role) for guests;
-- they return only an id / boolean, never order data.
revoke execute on function public.resolve_guest_order(text, text) from public, anon;
