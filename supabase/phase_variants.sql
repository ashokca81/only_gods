-- =====================================================================
-- Per-colour variants (images + sizes/stock + colour-wise price). Idempotent.
-- =====================================================================
alter table public.products add column if not exists variants jsonb not null default '[]'::jsonb;

-- Backfill existing products with a single default variant from flat fields.
update public.products p
set variants = jsonb_build_array(
  jsonb_build_object(
    'color', coalesce(p.colors[1], ''),
    'price', p.price,
    'original_price', p.original_price,
    'images', to_jsonb(case when coalesce(array_length(p.images, 1), 0) > 0 then p.images else array[p.image] end),
    'sizes', coalesce(
      (select jsonb_agg(jsonb_build_object('size', s, 'stock', p.stock)) from unnest(p.sizes) as s),
      '[]'::jsonb
    )
  )
)
where jsonb_array_length(p.variants) = 0;

-- place_order: colour-aware pricing (uses the matching variant's price).
create or replace function public.place_order(
  customer jsonb,
  items jsonb,
  payment text default 'cod'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_order_no text;
  v_subtotal numeric := 0;
  v_shipping numeric := 0;
  it jsonb;
  v_price numeric;
  v_vprice numeric;
  v_name text;
  v_image text;
  v_qty int;
begin
  if items is null or jsonb_array_length(items) = 0 then
    raise exception 'Cart is empty';
  end if;
  if coalesce(customer->>'name','') = '' or coalesce(customer->>'phone','') = ''
     or coalesce(customer->>'address','') = '' then
    raise exception 'Name, phone and address are required';
  end if;

  v_order_no := 'OG' || to_char(now(), 'YYMMDD') ||
                lpad((floor(random() * 100000))::int::text, 5, '0');

  insert into public.orders
    (order_no, customer_name, customer_phone, customer_email,
     address_line, city, state, pincode, payment_method)
  values
    (v_order_no,
     customer->>'name', customer->>'phone', nullif(customer->>'email',''),
     customer->>'address', nullif(customer->>'city',''),
     nullif(customer->>'state',''), nullif(customer->>'pincode',''),
     coalesce(nullif(payment,''), 'cod'))
  returning id into v_order_id;

  for it in select * from jsonb_array_elements(items)
  loop
    v_qty := greatest(1, coalesce((it->>'quantity')::int, 1));
    select price, name, image into v_price, v_name, v_image
      from public.products where id = it->>'id' and is_active = true;
    if v_price is null then
      continue; -- skip unknown/inactive products
    end if;

    -- colour-wise price: override with the matching variant's price if present
    v_vprice := null;
    select (vv->>'price')::numeric into v_vprice
      from public.products pp, jsonb_array_elements(coalesce(pp.variants, '[]'::jsonb)) vv
      where pp.id = it->>'id'
        and lower(coalesce(vv->>'color','')) = lower(coalesce(it->>'color',''))
      limit 1;
    if v_vprice is not null then
      v_price := v_vprice;
    end if;

    insert into public.order_items
      (order_id, product_id, name, image, price, quantity, size, color)
    values
      (v_order_id, it->>'id', v_name, v_image, v_price, v_qty,
       nullif(it->>'size',''), nullif(it->>'color',''));
    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;

  if v_subtotal = 0 then
    delete from public.orders where id = v_order_id;
    raise exception 'No valid items in cart';
  end if;

  v_shipping := case when v_subtotal >= 2000 then 0 else 99 end;
  update public.orders
     set subtotal = v_subtotal, shipping = v_shipping, total = v_subtotal + v_shipping
   where id = v_order_id;

  return jsonb_build_object(
    'order_no', v_order_no,
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'total', v_subtotal + v_shipping
  );
end;
$$;

grant execute on function public.place_order(jsonb, jsonb, text) to anon, authenticated;

select 'done' as status;
