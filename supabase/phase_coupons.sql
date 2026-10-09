-- =====================================================================
-- Coupons / discount codes. Server-authoritative discount. Idempotent.
-- =====================================================================
create table if not exists public.coupons (
  id                 uuid primary key default gen_random_uuid(),
  code               text unique not null,
  type               text not null default 'percent',  -- percent | flat
  value              numeric not null default 0,
  min_order          numeric not null default 0,
  max_discount       numeric,
  starts_at          timestamptz,
  expires_at         timestamptz,
  usage_limit        int,
  used_count         int not null default 0,
  per_customer_limit int,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);

alter table public.coupons enable row level security;
drop policy if exists "coupons admin all" on public.coupons;
create policy "coupons admin all" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount numeric not null default 0;

-- Validate a coupon against a subtotal (+ optional phone for per-customer limit).
create or replace function public.validate_coupon(p_code text, p_subtotal numeric, p_phone text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.coupons; v_disc numeric; v_used int;
begin
  if coalesce(p_code,'') = '' then return jsonb_build_object('valid', false, 'reason', 'Enter a code'); end if;
  select * into c from public.coupons where upper(code) = upper(p_code) limit 1;
  if c.id is null then return jsonb_build_object('valid', false, 'reason', 'Invalid coupon'); end if;
  if not c.is_active then return jsonb_build_object('valid', false, 'reason', 'Coupon is inactive'); end if;
  if c.starts_at is not null and now() < c.starts_at then return jsonb_build_object('valid', false, 'reason', 'Not started yet'); end if;
  if c.expires_at is not null and now() > c.expires_at then return jsonb_build_object('valid', false, 'reason', 'Coupon expired'); end if;
  if p_subtotal < coalesce(c.min_order, 0) then
    return jsonb_build_object('valid', false, 'reason', 'Minimum order Rs ' || c.min_order::int || ' required');
  end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return jsonb_build_object('valid', false, 'reason', 'Coupon limit reached');
  end if;
  if c.per_customer_limit is not null and coalesce(p_phone,'') <> '' then
    select count(*) into v_used from public.orders
      where coupon_code = c.code and customer_phone = p_phone and status <> 'cancelled';
    if v_used >= c.per_customer_limit then
      return jsonb_build_object('valid', false, 'reason', 'You have already used this coupon');
    end if;
  end if;

  if c.type = 'flat' then
    v_disc := c.value;
  else
    v_disc := p_subtotal * c.value / 100.0;
    if c.max_discount is not null then v_disc := least(v_disc, c.max_discount); end if;
  end if;
  v_disc := round(least(greatest(v_disc, 0), p_subtotal));

  return jsonb_build_object('valid', true, 'discount', v_disc, 'code', c.code, 'type', c.type, 'value', c.value);
end; $$;

grant execute on function public.validate_coupon(text, numeric, text) to anon, authenticated;

-- Recreate place_order with coupon support (keeps Phase-2 stock decrement).
drop function if exists public.place_order(jsonb, jsonb, text, uuid);
create or replace function public.place_order(
  customer jsonb,
  items jsonb,
  payment text default 'cod',
  p_customer_id uuid default null,
  p_coupon text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid; v_order_no text; v_subtotal numeric := 0; v_shipping numeric := 0;
  v_discount numeric := 0; v_coupon_code text := null; v_coupon jsonb;
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

  for it in select * from jsonb_array_elements(items)
  loop
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

  -- Coupon (server-authoritative).
  if coalesce(p_coupon, '') <> '' then
    v_coupon := public.validate_coupon(p_coupon, v_subtotal, customer->>'phone');
    if (v_coupon->>'valid')::boolean then
      v_discount := coalesce((v_coupon->>'discount')::numeric, 0);
      v_coupon_code := v_coupon->>'code';
      update public.coupons set used_count = used_count + 1 where upper(code) = upper(p_coupon);
    end if;
  end if;

  v_shipping := case when v_subtotal >= 2000 then 0 else 99 end;
  update public.orders
     set subtotal = v_subtotal, shipping = v_shipping, discount = v_discount, coupon_code = v_coupon_code,
         total = greatest(0, v_subtotal - v_discount) + v_shipping
   where id = v_order_id;

  perform public.adjust_order_stock(v_order_id, -1);

  return jsonb_build_object(
    'order_no', v_order_no, 'subtotal', v_subtotal, 'shipping', v_shipping,
    'discount', v_discount, 'coupon', v_coupon_code, 'total', greatest(0, v_subtotal - v_discount) + v_shipping
  );
end; $$;

grant execute on function public.place_order(jsonb, jsonb, text, uuid, text) to anon, authenticated;

select 'coupons done' as status;
