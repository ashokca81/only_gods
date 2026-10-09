-- =====================================================================
-- Abandoned-cart capture. A logged-in customer's cart snapshot; deleted on order.
-- Idempotent.
-- =====================================================================
create table if not exists public.carts (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  items       jsonb not null default '[]'::jsonb,
  subtotal    numeric not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.carts enable row level security;
drop policy if exists "carts admin all" on public.carts;
create policy "carts admin all" on public.carts
  for all using (public.is_admin()) with check (public.is_admin());

-- Customer upserts their cart snapshot (secret-gated). Empty cart clears it.
create or replace function public.cart_sync(p_secret text, p_cid uuid, p_items jsonb, p_subtotal numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  if p_cid is null then return; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    delete from public.carts where customer_id = p_cid;
    return;
  end if;
  insert into public.carts (customer_id, items, subtotal, updated_at)
    values (p_cid, p_items, coalesce(p_subtotal, 0), now())
  on conflict (customer_id) do update
    set items = excluded.items, subtotal = excluded.subtotal, updated_at = now();
end; $$;

grant execute on function public.cart_sync(text, uuid, jsonb, numeric) to anon, authenticated;

-- Clear a customer's cart snapshot (called after a successful order).
create or replace function public.cart_clear(p_secret text, p_cid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  delete from public.carts where customer_id = p_cid;
end; $$;

grant execute on function public.cart_clear(text, uuid) to anon, authenticated;

select 'carts done' as status;
