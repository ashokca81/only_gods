-- ============================================================
-- Newsletter subscribers (email capture from site). Idempotent.
-- ============================================================
create table if not exists public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  source      text,
  created_at  timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
drop policy if exists "newsletter admin all" on public.newsletter_subscribers;
create policy "newsletter admin all" on public.newsletter_subscribers
  for all using (public.is_admin()) with check (public.is_admin());

-- Anyone can subscribe (secret-gated, no login required).
create or replace function public.subscribe_newsletter(p_secret text, p_email text, p_source text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  perform public.chk_secret(p_secret);
  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' or position('@' in v_email) = 0 or position('.' in v_email) = 0 then
    raise exception 'Invalid email';
  end if;
  insert into public.newsletter_subscribers (email, source)
    values (v_email, nullif(trim(coalesce(p_source, '')), ''))
  on conflict (email) do nothing;
  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.subscribe_newsletter(text, text, text) to anon, authenticated;

select 'newsletter done' as status;
