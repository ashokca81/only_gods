-- =====================================================================
-- Flash sale: store-wide auto % off within a time window (settings key='flash_sale').
-- Applied server-side in place_order + quote_order, stacks with coupons. Idempotent.
-- =====================================================================
create or replace function public.flash_discount(p_subtotal numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; v_pct numeric; v_start timestamptz; v_end timestamptz;
begin
  select value into v from public.settings where key = 'flash_sale';
  if v is null or not coalesce((v->>'enabled')::boolean, false) then
    return jsonb_build_object('discount', 0, 'percent', 0);
  end if;
  v_pct := coalesce((v->>'percent')::numeric, 0);
  v_start := nullif(v->>'start', '')::timestamptz;
  v_end := nullif(v->>'end', '')::timestamptz;
  if v_pct <= 0 then return jsonb_build_object('discount', 0, 'percent', 0); end if;
  if v_start is not null and now() < v_start then return jsonb_build_object('discount', 0, 'percent', 0); end if;
  if v_end is not null and now() > v_end then return jsonb_build_object('discount', 0, 'percent', 0); end if;
  return jsonb_build_object('discount', round(p_subtotal * v_pct / 100), 'percent', v_pct);
end; $$;

grant execute on function public.flash_discount(numeric) to anon, authenticated;

-- quote_order: price preview incl. flash + coupon.
create or replace function public.quote_order(items jsonb, p_phone text default null, p_coupon text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  it jsonb; v_price numeric; v_vprice numeric; v_qty int;
  v_subtotal numeric := 0; v_shipping numeric := 0; v_discount numeric := 0; v_flash numeric := 0;
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
    if (v_coupon->>'valid')::boolean then v_discount := coalesce((v_coupon->>'discount')::numeric, 0); v_code := v_coupon->>'code'; end if;
  end if;
  v_flash := coalesce((public.flash_discount(v_subtotal)->>'discount')::numeric, 0);
  v_discount := least(v_discount + v_flash, v_subtotal);

  v_shipping := case when v_subtotal >= 2000 then 0 else 99 end;
  return jsonb_build_object('subtotal', v_subtotal, 'shipping', v_shipping, 'discount', v_discount,
    'flash', v_flash, 'coupon', v_code, 'total', greatest(0, v_subtotal - v_discount) + v_shipping);
end; $$;

grant execute on function public.quote_order(jsonb, text, text) to anon, authenticated;

-- place_order: now also applies the flash discount.
drop function if exists public.place_order(jsonb, jsonb, text, uuid, text);
create or replace function public.place_order(
  customer jsonb, items jsonb, payment text default 'cod', p_customer_id uuid default null, p_coupon text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid; v_order_no text; v_subtotal numeric := 0; v_shipping numeric := 0;
  v_discount numeric := 0; v_coupon_disc numeric := 0; v_flash numeric := 0; v_coupon_code text := null; v_coupon jsonb;
  it jsonb; v_price numeric; v_vprice numeric; v_name text; v_image text; v_qty int;
begin
  if items is null or jsonb_array_length(items) = 0 then raise exception 'Cart is empty'; end if;
  if coalesce(customer->>'name','') = '' or coalesce(customer->>'phone','') = ''
     or coalesce(customer->>'address','') = '' then
    raise exception 'Name, phone and address are required';
  end if;

  v_order_no := 'OG' || to_char(now(), 'YYMMDD') || lpad((floor(random() * 100000))::int::text, 5, '0');

  insert into public.orders
    (order_no, customer_name, customer_phone, customer_email, address_line, city, state, pincode, payment_method, customer_id)
  values
    (v_order_no, customer->>'name', customer->>'phone', nullif(customer->>'email',''),
     customer->>'address', nullif(customer->>'city',''), nullif(customer->>'state',''),
     nullif(customer->>'pincode',''), coalesce(nullif(payment,''), 'cod'), p_customer_id)
  returning id into v_order_id;

  for it in select * from jsonb_array_elements(items) loop
    v_qty := greatest(1, coalesce((it->>'quantity')::int, 1));
    select price, name, image into v_price, v_name, v_image
      from public.products where id = it->>'id' and is_active = true;
    if v_price is null then continue; end if;
    v_vprice := null;
    select (vv->>'price')::numeric into v_vprice
      from public.products pp, jsonb_array_elements(coalesce(pp.variants, '[]'::jsonb)) vv
      where pp.id = it->>'id' and lower(coalesce(vv->>'color','')) = lower(coalesce(it->>'color',''))
      limit 1;
    if v_vprice is not null then v_price := v_vprice; end if;
    insert into public.order_items (order_id, product_id, name, image, price, quantity, size, color)
    values (v_order_id, it->>'id', v_name, v_image, v_price, v_qty, nullif(it->>'size',''), nullif(it->>'color',''));
    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;

  if v_subtotal = 0 then
    delete from public.orders where id = v_order_id;
    raise exception 'No valid items in cart';
  end if;

  if coalesce(p_coupon, '') <> '' then
    v_coupon := public.validate_coupon(p_coupon, v_subtotal, customer->>'phone');
    if (v_coupon->>'valid')::boolean then
      v_coupon_disc := coalesce((v_coupon->>'discount')::numeric, 0);
      v_coupon_code := v_coupon->>'code';
      update public.coupons set used_count = used_count + 1 where upper(code) = upper(p_coupon);
    end if;
  end if;

  v_flash := coalesce((public.flash_discount(v_subtotal)->>'discount')::numeric, 0);
  v_discount := least(v_coupon_disc + v_flash, v_subtotal);

  v_shipping := case when v_subtotal >= 2000 then 0 else 99 end;
  update public.orders
     set subtotal = v_subtotal, shipping = v_shipping, discount = v_discount, coupon_code = v_coupon_code,
         total = greatest(0, v_subtotal - v_discount) + v_shipping
   where id = v_order_id;

  perform public.adjust_order_stock(v_order_id, -1);

  return jsonb_build_object('order_no', v_order_no, 'subtotal', v_subtotal, 'shipping', v_shipping,
    'discount', v_discount, 'coupon', v_coupon_code, 'flash', v_flash, 'total', greatest(0, v_subtotal - v_discount) + v_shipping);
end; $$;

grant execute on function public.place_order(jsonb, jsonb, text, uuid, text) to anon, authenticated;

select 'flash done' as status;
