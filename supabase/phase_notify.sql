-- =====================================================================
-- Back-in-stock "notify me" waitlist. Idempotent.
-- =====================================================================
create table if not exists public.stock_notifications (
  id          uuid primary key default gen_random_uuid(),
  product_id  text references public.products(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  phone       text,
  name        text,
  notified    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (product_id, customer_id)
);

alter table public.stock_notifications enable row level security;
drop policy if exists "stock_notifications admin all" on public.stock_notifications;
create policy "stock_notifications admin all" on public.stock_notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- Customer asks to be notified when a product is back (secret-gated).
create or replace function public.request_stock_notify(p_secret text, p_cid uuid, p_product text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_name text; v_phone text;
begin
  perform public.chk_secret(p_secret);
  if p_cid is null then raise exception 'login required'; end if;
  if p_product is null then raise exception 'Missing product'; end if;
  select name, phone into v_name, v_phone from public.customers where id = p_cid;
  insert into public.stock_notifications (product_id, customer_id, phone, name)
    values (p_product, p_cid, v_phone, coalesce(nullif(trim(v_name), ''), 'Customer'))
  on conflict (product_id, customer_id) do update set notified = false;
  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.request_stock_notify(text, uuid, text) to anon, authenticated;

select 'notify done' as status;
