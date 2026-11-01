-- ============================================================
-- PayU (hosted checkout) — pending payments + idempotent finalize. Idempotent.
-- The cart is saved server-side before redirecting to PayU, because the
-- customer leaves the site and PayU posts back (return URL + webhook).
-- ============================================================
alter table public.orders add column if not exists payu_txnid    text;
alter table public.orders add column if not exists payu_mihpayid text;

create table if not exists public.payu_payments (
  txnid        text primary key,
  customer_id  uuid not null,
  payload      jsonb not null,           -- { customer, items, coupon }
  amount       numeric not null,
  status       text not null default 'pending', -- pending|processing|paid|failed|paid_no_order
  order_no     text,
  mihpayid     text,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.payu_payments enable row level security;
drop policy if exists "payu admin read" on public.payu_payments;
create policy "payu admin read" on public.payu_payments
  for select using (public.is_admin());

-- Save a pending payment before redirecting to PayU.
create or replace function public.payu_create(p_secret text, p_txnid text, p_cid uuid, p_payload jsonb, p_amount numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  insert into public.payu_payments (txnid, customer_id, payload, amount)
  values (p_txnid, p_cid, p_payload, p_amount);
end; $$;

-- Atomically claim a pending payment so the return page and the webhook can
-- never both create the order. Returns the row only to the single winner.
create or replace function public.payu_claim(p_secret text, p_txnid text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.payu_payments;
begin
  perform public.chk_secret(p_secret);
  update public.payu_payments
     set status = 'processing', updated_at = now()
   where txnid = p_txnid and status = 'pending'
  returning * into r;
  if r.txnid is null then return null; end if;
  return jsonb_build_object('customer_id', r.customer_id, 'payload', r.payload, 'amount', r.amount);
end; $$;

-- Record the outcome and stamp the order as paid.
create or replace function public.payu_complete(p_secret text, p_txnid text, p_status text, p_order_no text, p_mihpayid text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  update public.payu_payments
     set status = p_status, order_no = coalesce(p_order_no, order_no),
         mihpayid = coalesce(p_mihpayid, mihpayid), note = p_note, updated_at = now()
   where txnid = p_txnid;
  if p_order_no is not null then
    update public.orders
       set payment_status = 'paid', payu_txnid = p_txnid, payu_mihpayid = p_mihpayid
     where order_no = p_order_no;
  end if;
end; $$;

-- Mark a still-pending payment as failed/cancelled.
create or replace function public.payu_fail(p_secret text, p_txnid text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  update public.payu_payments
     set status = 'failed', note = p_note, updated_at = now()
   where txnid = p_txnid and status = 'pending';
end; $$;

-- Read status (for the return page when the webhook already finished).
create or replace function public.payu_get(p_secret text, p_txnid text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.payu_payments;
begin
  perform public.chk_secret(p_secret);
  select * into r from public.payu_payments where txnid = p_txnid;
  if r.txnid is null then return null; end if;
  return jsonb_build_object('status', r.status, 'order_no', r.order_no, 'amount', r.amount, 'customer_id', r.customer_id);
end; $$;

grant execute on function public.payu_create(text, text, uuid, jsonb, numeric) to anon, authenticated;
grant execute on function public.payu_claim(text, text) to anon, authenticated;
grant execute on function public.payu_complete(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.payu_fail(text, text, text) to anon, authenticated;
grant execute on function public.payu_get(text, text) to anon, authenticated;

select 'payu done' as status;
