-- =====================================================================
-- Customer accounts (mobile OTP), addresses, wishlist. Idempotent.
-- Data access is via SECURITY DEFINER RPCs gated by a shared rpc_secret
-- (stored in the locked app_secrets table) — so no service_role key needed.
-- =====================================================================

create table if not exists public.app_secrets (
  key text primary key,
  value text not null
);
insert into public.app_secrets (key, value)
values ('rpc_secret', 'b16cce6165eeb2fed1592c19afe7f4ffd236ae65789431d7')
on conflict (key) do update set value = excluded.value;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.otp_codes (
  phone text primary key,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text, phone text,
  line text not null, city text, state text, pincode text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist (
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

alter table public.orders add column if not exists customer_id uuid references public.customers(id) on delete set null;

-- Lock everything; admins can read customers/addresses/orders. Customer ops use RPCs.
alter table public.app_secrets enable row level security;
alter table public.customers enable row level security;
alter table public.otp_codes enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlist enable row level security;

drop policy if exists "customers admin read" on public.customers;
create policy "customers admin read" on public.customers for select using (public.is_admin());
drop policy if exists "addresses admin read" on public.addresses;
create policy "addresses admin read" on public.addresses for select using (public.is_admin());

-- ---- secret check helper ----
create or replace function public.chk_secret(p_secret text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_secret is null or p_secret <> (select value from public.app_secrets where key = 'rpc_secret') then
    raise exception 'forbidden';
  end if;
end; $$;

-- ---- OTP ----
create or replace function public.otp_set(p_secret text, p_phone text, p_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  insert into public.otp_codes (phone, code, expires_at)
  values (p_phone, p_code, now() + interval '5 minutes')
  on conflict (phone) do update set code = excluded.code, expires_at = excluded.expires_at, created_at = now();
end; $$;

create or replace function public.otp_verify(p_secret text, p_phone text, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cid uuid; v_row public.customers;
begin
  perform public.chk_secret(p_secret);
  if not exists (select 1 from public.otp_codes where phone = p_phone and code = p_code and expires_at > now()) then
    raise exception 'Invalid or expired code';
  end if;
  delete from public.otp_codes where phone = p_phone;
  insert into public.customers (phone) values (p_phone) on conflict (phone) do nothing;
  select * into v_row from public.customers where phone = p_phone;
  return jsonb_build_object('id', v_row.id, 'phone', v_row.phone, 'name', v_row.name, 'avatar_url', v_row.avatar_url);
end; $$;

-- ---- customer profile ----
create or replace function public.customer_get(p_secret text, p_cid uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v public.customers;
begin
  perform public.chk_secret(p_secret);
  select * into v from public.customers where id = p_cid;
  if v is null then return null; end if;
  return jsonb_build_object('id', v.id, 'phone', v.phone, 'name', v.name, 'avatar_url', v.avatar_url);
end; $$;

create or replace function public.customer_update(p_secret text, p_cid uuid, p_name text, p_avatar text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  update public.customers
     set name = coalesce(nullif(p_name, ''), name),
         avatar_url = coalesce(nullif(p_avatar, ''), avatar_url)
   where id = p_cid;
end; $$;

create or replace function public.customer_orders(p_secret text, p_cid uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  return coalesce((
    select jsonb_agg(row_to_json(t)) from (
      select ord.id, ord.order_no, ord.status, ord.total, ord.subtotal, ord.shipping,
             ord.payment_method, ord.created_at, ord.address_line, ord.city, ord.state, ord.pincode,
             coalesce((select jsonb_agg(jsonb_build_object('name', oi.name, 'image', oi.image,
                       'price', oi.price, 'quantity', oi.quantity, 'size', oi.size, 'color', oi.color))
                       from public.order_items oi where oi.order_id = ord.id), '[]'::jsonb) as items
      from public.orders ord where ord.customer_id = p_cid order by ord.created_at desc
    ) t
  ), '[]'::jsonb);
end; $$;

-- ---- addresses ----
create or replace function public.customer_addresses(p_secret text, p_cid uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  return coalesce((select jsonb_agg(row_to_json(a)) from (
    select * from public.addresses where customer_id = p_cid order by is_default desc, created_at desc
  ) a), '[]'::jsonb);
end; $$;

create or replace function public.address_save(p_secret text, p_cid uuid, p jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  if coalesce((p->>'is_default')::boolean, false) then
    update public.addresses set is_default = false where customer_id = p_cid;
  end if;
  insert into public.addresses (customer_id, name, phone, line, city, state, pincode, is_default)
  values (p_cid, p->>'name', p->>'phone', coalesce(p->>'line',''), p->>'city', p->>'state', p->>'pincode',
          coalesce((p->>'is_default')::boolean, false));
end; $$;

create or replace function public.address_delete(p_secret text, p_cid uuid, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  delete from public.addresses where id = p_id and customer_id = p_cid;
end; $$;

-- ---- wishlist ----
create or replace function public.wishlist_list(p_secret text, p_cid uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'price', p.price,
           'originalPrice', p.original_price, 'image', p.image, 'category', p.category))
    from public.wishlist w join public.products p on p.id = w.product_id
    where w.customer_id = p_cid and p.is_active = true
  ), '[]'::jsonb);
end; $$;

create or replace function public.wishlist_toggle(p_secret text, p_cid uuid, p_pid text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_in boolean;
begin
  perform public.chk_secret(p_secret);
  if exists (select 1 from public.wishlist where customer_id = p_cid and product_id = p_pid) then
    delete from public.wishlist where customer_id = p_cid and product_id = p_pid;
    v_in := false;
  else
    insert into public.wishlist (customer_id, product_id) values (p_cid, p_pid) on conflict do nothing;
    v_in := true;
  end if;
  return jsonb_build_object('in_wishlist', v_in);
end; $$;

grant execute on function
  public.otp_set(text, text, text),
  public.otp_verify(text, text, text),
  public.customer_get(text, uuid),
  public.customer_update(text, uuid, text, text),
  public.customer_orders(text, uuid),
  public.customer_addresses(text, uuid),
  public.address_save(text, uuid, jsonb),
  public.address_delete(text, uuid, uuid),
  public.wishlist_list(text, uuid),
  public.wishlist_toggle(text, uuid, text)
to anon, authenticated;

-- ---- place_order: now also links the order to a customer ----
drop function if exists public.place_order(jsonb, jsonb, text);
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

  return jsonb_build_object('order_no', v_order_no, 'subtotal', v_subtotal, 'shipping', v_shipping, 'total', v_subtotal + v_shipping);
end; $$;

grant execute on function public.place_order(jsonb, jsonb, text, uuid) to anon, authenticated;

select 'done' as status;
