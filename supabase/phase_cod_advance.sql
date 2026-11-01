-- =====================================================================
-- COD advance: per-product advance (₹) that must be paid online (PayU)
-- before a Cash-on-Delivery order is booked. 0 = normal COD (unchanged).
-- Enforced in place_order: a COD order needing an advance can only be
-- created through place_order_advance (secret-gated, after PayU success).
-- Idempotent.
-- =====================================================================
alter table public.products add column if not exists cod_advance numeric not null default 0;
alter table public.orders   add column if not exists advance_paid numeric not null default 0;

-- Advance for a cart = Σ product.cod_advance × quantity (active products only).
create or replace function public.cod_advance_quote(items jsonb)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(p.cod_advance * greatest(1, coalesce((it->>'quantity')::int, 1))), 0)
    from jsonb_array_elements(coalesce(items, '[]'::jsonb)) it
    join public.products p on p.id = it->>'id' and p.is_active = true;
$$;
grant execute on function public.cod_advance_quote(jsonb) to anon, authenticated;

-- Guard inside the live place_order (inserted once, before the flash discount).
do $$
declare
  d text;
  anchor constant text := 'v_flash := coalesce((public.flash_discount(v_subtotal)';
  guard constant text :=
    'if coalesce(nullif(payment, ''''), ''cod'') = ''cod'' and public.cod_advance_quote(items) > 0' || chr(10) ||
    '     and coalesce(current_setting(''og.advance_ok'', true), '''') <> ''1'' then' || chr(10) ||
    '    raise exception ''Advance payment is required for Cash on Delivery'';' || chr(10) ||
    '  end if;' || chr(10) || '  ';
begin
  d := pg_get_functiondef('public.place_order(jsonb,jsonb,text,uuid,text)'::regprocedure);
  if position('og.advance_ok' in d) > 0 then return; end if;
  if position(anchor in d) = 0 then raise exception 'anchor not found in place_order'; end if;
  execute replace(d, anchor, guard || anchor);
end $$;

-- Book a COD order after its advance was paid (called by the PayU finalize).
create or replace function public.place_order_advance(
  p_secret text, customer jsonb, items jsonb, p_customer_id uuid default null, p_coupon text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  perform set_config('og.advance_ok', '1', true);
  return public.place_order(customer, items, 'cod', p_customer_id, p_coupon);
end; $$;
grant execute on function public.place_order_advance(text, jsonb, jsonb, uuid, text) to anon, authenticated;

-- payu_complete: a COD-advance payment marks the order "advance" (not fully paid).
create or replace function public.payu_complete(p_secret text, p_txnid text, p_status text, p_order_no text, p_mihpayid text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.payu_payments;
begin
  perform public.chk_secret(p_secret);
  update public.payu_payments
     set status = p_status, order_no = coalesce(p_order_no, order_no),
         mihpayid = coalesce(p_mihpayid, mihpayid), note = p_note, updated_at = now()
   where txnid = p_txnid
  returning * into r;
  if p_order_no is not null then
    if coalesce(r.payload->>'purpose', 'full') = 'cod_advance' then
      update public.orders
         set payment_status = 'advance', advance_paid = r.amount, payu_txnid = p_txnid, payu_mihpayid = p_mihpayid
       where order_no = p_order_no;
    else
      update public.orders
         set payment_status = 'paid', payu_txnid = p_txnid, payu_mihpayid = p_mihpayid
       where order_no = p_order_no;
    end if;
  end if;
end; $$;

-- payu_get: also return the order total (COD advance: amount paid < order total).
create or replace function public.payu_get(p_secret text, p_txnid text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.payu_payments; v_total numeric;
begin
  perform public.chk_secret(p_secret);
  select * into r from public.payu_payments where txnid = p_txnid;
  if r.txnid is null then return null; end if;
  if r.order_no is not null then select total into v_total from public.orders where order_no = r.order_no; end if;
  return jsonb_build_object('status', r.status, 'order_no', r.order_no, 'amount', r.amount,
    'customer_id', r.customer_id, 'order_total', coalesce(v_total, r.amount));
end; $$;

select 'cod advance done' as status,
  position('og.advance_ok' in pg_get_functiondef('public.place_order(jsonb,jsonb,text,uuid,text)'::regprocedure)) > 0 as guard_ok;
