-- =====================================================================
-- Phase 3: Orders (cart -> checkout -> orders). Idempotent.
-- =====================================================================

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_no        text unique not null,
  customer_name   text not null,
  customer_phone  text not null,
  customer_email  text,
  address_line    text not null,
  city            text,
  state           text,
  pincode         text,
  payment_method  text not null default 'cod',
  status          text not null default 'pending',  -- pending|confirmed|shipped|delivered|cancelled
  subtotal        numeric not null default 0,
  shipping        numeric not null default 0,
  total           numeric not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  text,
  name        text not null,
  image       text,
  price       numeric not null,
  quantity    integer not null,
  size        text,
  color       text
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- RLS: only admins can read/manage. Order creation goes through the
-- security-definer place_order() RPC, so no anon table policies are needed.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders admin all" on public.orders;
create policy "orders admin all" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items admin all" on public.order_items;
create policy "order_items admin all" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- place_order: validates + prices the cart from the products table
-- (anti-tamper), creates the order + items, returns the order summary.
-- =====================================================================
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
    insert into public.order_items
      (order_id, product_id, name, image, price, quantity, size, color)
    values
      (v_order_id, it->>'id', v_name, v_image, v_price, v_qty,
       nullif(it->>'size',''), nullif(it->>'color',''));
    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;

  if v_subtotal = 0 then
    -- nothing valid was added; roll back by deleting the empty order
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
