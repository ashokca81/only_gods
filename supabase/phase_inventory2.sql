-- =====================================================================
-- Phase 2: overselling protection — stock auto-decrements when an order is
-- placed and is restored when an order is cancelled. Idempotent.
-- =====================================================================

-- Apply a stock change for every item of an order. p_sign = -1 (sale) or +1 (restore).
create or replace function public.adjust_order_stock(p_order_id uuid, p_sign int)
returns void language plpgsql security definer set search_path = public as $$
declare
  it record; v_has_variant boolean; v_new int; v_delta int;
begin
  for it in
    select product_id, size, color, quantity
    from public.order_items
    where order_id = p_order_id and product_id is not null
  loop
    v_delta := p_sign * greatest(1, coalesce(it.quantity, 1));

    select exists(
      select 1 from public.products pp, jsonb_array_elements(coalesce(pp.variants, '[]'::jsonb)) vv
      where pp.id = it.product_id and jsonb_array_length(coalesce(vv->'sizes', '[]'::jsonb)) > 0
    ) into v_has_variant;

    if v_has_variant then
      -- Adjust the matching colour + size, clamped at 0.
      update public.products pp set variants = (
        select jsonb_agg(
          case when lower(coalesce(v->>'color','')) = lower(coalesce(it.color,''))
          then jsonb_set(v, '{sizes}', (
            select jsonb_agg(
              case when s->>'size' = it.size
              then jsonb_set(s, '{stock}', to_jsonb(greatest(0, coalesce((s->>'stock')::int, 0) + v_delta)))
              else s end)
            from jsonb_array_elements(coalesce(v->'sizes', '[]'::jsonb)) s))
          else v end)
        from jsonb_array_elements(coalesce(pp.variants, '[]'::jsonb)) v)
      where pp.id = it.product_id;

      -- Flat stock = sum of all variant sizes.
      update public.products pp set stock = coalesce((
        select sum((s->>'stock')::int)
        from jsonb_array_elements(coalesce(pp.variants, '[]'::jsonb)) v,
             jsonb_array_elements(coalesce(v->'sizes', '[]'::jsonb)) s), 0)
      where pp.id = it.product_id
      returning stock into v_new;
    else
      update public.products set stock = greatest(0, coalesce(stock, 0) + v_delta)
      where id = it.product_id
      returning stock into v_new;
    end if;

    if v_new is not null then
      insert into public.stock_movements(product_id, change, new_stock, reason, note)
      values (it.product_id, v_delta, v_new,
              case when p_sign < 0 then 'sale' else 'restock' end,
              'order ' || coalesce((select order_no from public.orders where id = p_order_id), ''));
    end if;
  end loop;
end; $$;

-- Recreate place_order to decrement stock after the items are inserted.
create or replace function public.place_order(
  customer jsonb,
  items jsonb,
  payment text default 'cod',
  p_customer_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid; v_order_no text; v_subtotal numeric := 0; v_shipping numeric := 0;
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

  v_shipping := case when v_subtotal >= 2000 then 0 else 99 end;
  update public.orders set subtotal = v_subtotal, shipping = v_shipping, total = v_subtotal + v_shipping
   where id = v_order_id;

  -- Overselling protection: reduce stock for every ordered item.
  perform public.adjust_order_stock(v_order_id, -1);

  return jsonb_build_object('order_no', v_order_no, 'subtotal', v_subtotal, 'shipping', v_shipping, 'total', v_subtotal + v_shipping);
end; $$;

grant execute on function public.place_order(jsonb, jsonb, text, uuid) to anon, authenticated;

-- Restore / re-deduct stock automatically when an order's status flips to/from cancelled.
create or replace function public.orders_stock_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if OLD.status is distinct from 'cancelled' and NEW.status = 'cancelled' then
    perform public.adjust_order_stock(NEW.id, 1);
  elsif OLD.status = 'cancelled' and NEW.status is distinct from 'cancelled' then
    perform public.adjust_order_stock(NEW.id, -1);
  end if;
  return NEW;
end; $$;

drop trigger if exists orders_stock_sync_trg on public.orders;
create trigger orders_stock_sync_trg
  after update of status on public.orders
  for each row execute function public.orders_stock_sync();

select 'inventory phase 2 done' as status;
