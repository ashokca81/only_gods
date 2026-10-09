-- =====================================================================
-- Razorpay online payments: order payment fields + price quote RPC.
-- Idempotent. place_order stays untouched.
-- =====================================================================
alter table public.orders add column if not exists razorpay_order_id   text;
alter table public.orders add column if not exists razorpay_payment_id text;
alter table public.orders add column if not exists payment_status      text not null default 'cod'; -- cod | paid | pending

-- Compute an order's price (subtotal/shipping/discount/total) WITHOUT creating it.
-- Mirrors place_order's pricing so the Razorpay amount and the final order match.
create or replace function public.quote_order(items jsonb, p_phone text default null, p_coupon text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  it jsonb; v_price numeric; v_vprice numeric; v_qty int;
  v_subtotal numeric := 0; v_shipping numeric := 0; v_discount numeric := 0;
  v_coupon jsonb; v_code text := null;
begin
  if items is null or jsonb_array_length(items) = 0 then return jsonb_build_object('error', 'empty'); end if;

  for it in select * from jsonb_array_elements(items) loop
    v_qty := greatest(1, coalesce((it->>'quantity')::int, 1));
    select price into v_price from public.products where id = it->>'id' and is_active = true;
    if v_price is null then continue; end if;
    v_vprice := null;
    select (vv->>'price')::numeric into v_vprice
      from public.products pp, jsonb_array_elements(coalesce(pp.variants, '[]'::jsonb)) vv
      where pp.id = it->>'id' and lower(coalesce(vv->>'color','')) = lower(coalesce(it->>'color',''))
      limit 1;
    if v_vprice is not null then v_price := v_vprice; end if;
    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;

  if v_subtotal = 0 then return jsonb_build_object('error', 'no valid items'); end if;

  if coalesce(p_coupon, '') <> '' then
    v_coupon := public.validate_coupon(p_coupon, v_subtotal, p_phone);
    if (v_coupon->>'valid')::boolean then
      v_discount := coalesce((v_coupon->>'discount')::numeric, 0);
      v_code := v_coupon->>'code';
    end if;
  end if;

  v_shipping := case when v_subtotal >= 2000 then 0 else 99 end;
  return jsonb_build_object(
    'subtotal', v_subtotal, 'shipping', v_shipping, 'discount', v_discount,
    'coupon', v_code, 'total', greatest(0, v_subtotal - v_discount) + v_shipping
  );
end; $$;

grant execute on function public.quote_order(jsonb, text, text) to anon, authenticated;

select 'razorpay done' as status;
