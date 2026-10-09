-- =====================================================================
-- Product reviews & ratings (moderated). Idempotent.
-- =====================================================================
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  text references public.products(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  name        text not null default 'Customer',
  rating      int not null check (rating between 1 and 5),
  title       text,
  body        text,
  is_approved boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (product_id, customer_id)
);

create index if not exists reviews_product_idx on public.reviews(product_id, is_approved, created_at desc);

alter table public.reviews enable row level security;
-- Everyone can read APPROVED reviews; admins can read all.
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews
  for select using (is_approved = true or public.is_admin());
-- Admins can update / delete / insert.
drop policy if exists "reviews admin write" on public.reviews;
create policy "reviews admin write" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- Customer submits a review (secret-gated, goes to pending). One per product/customer.
create or replace function public.submit_review(
  p_secret text, p_cid uuid, p_product text, p_rating int, p_title text, p_body text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  perform public.chk_secret(p_secret);
  if p_cid is null then raise exception 'login required'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'Rating must be 1 to 5'; end if;
  select coalesce(nullif(trim(name), ''), 'Customer') into v_name from public.customers where id = p_cid;
  insert into public.reviews (product_id, customer_id, name, rating, title, body, is_approved)
    values (p_product, p_cid, coalesce(v_name, 'Customer'), p_rating, nullif(trim(p_title), ''), nullif(trim(p_body), ''), false)
  on conflict (product_id, customer_id) do update
    set rating = excluded.rating, title = excluded.title, body = excluded.body,
        is_approved = false, created_at = now();
  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.submit_review(text, uuid, text, int, text, text) to anon, authenticated;

select 'reviews done' as status;
