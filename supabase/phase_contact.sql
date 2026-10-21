-- ============================================================
-- Contact form messages (from the Contact Us page). Idempotent.
-- ============================================================
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text not null,
  message     text not null,
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
drop policy if exists "contact admin all" on public.contact_messages;
create policy "contact admin all" on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());

-- Anyone can send a message (secret-gated, no login required).
create or replace function public.submit_contact_message(p_secret text, p_name text, p_email text, p_message text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_email text; v_msg text;
begin
  perform public.chk_secret(p_secret);
  v_email := lower(trim(coalesce(p_email, '')));
  v_msg := trim(coalesce(p_message, ''));
  if v_email = '' or position('@' in v_email) = 0 or position('.' in v_email) = 0 then
    raise exception 'Invalid email';
  end if;
  if v_msg = '' then
    raise exception 'Message is required';
  end if;
  insert into public.contact_messages (name, email, message)
    values (nullif(trim(coalesce(p_name, '')), ''), v_email, left(v_msg, 4000));
  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.submit_contact_message(text, text, text, text) to anon, authenticated;

select 'contact done' as status;
