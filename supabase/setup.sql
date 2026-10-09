-- =====================================================================
-- ONLY GODS — Phase 1 database setup
-- Run this ONCE in Supabase: Dashboard -> SQL Editor -> paste -> Run.
-- It is idempotent (safe to run again).
-- =====================================================================

-- ---------- extensions ----------
create extension if not exists "pgcrypto";

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- PROFILES (one row per auth user; holds the admin role)
-- =====================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'customer',   -- 'customer' | 'admin'
  created_at  timestamptz not null default now()
);

-- Auto-create a profile whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin check used by RLS policies (security definer -> bypasses RLS here).
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =====================================================================
-- PRODUCTS
-- =====================================================================
create table if not exists public.products (
  id              text primary key default gen_random_uuid()::text,
  name            text not null,
  price           numeric not null default 0,
  original_price  numeric,
  image           text not null default '',
  category        text not null default '',
  colors          text[] not null default '{}',
  sizes           text[] not null default '{}',
  description     text not null default '',
  trending        boolean not null default false,
  new_arrival     boolean not null default false,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- =====================================================================
-- SETTINGS (key/value for hero, banners, site-wide options — Phase 2)
-- =====================================================================
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.settings enable row level security;

-- profiles: a user sees/updates own row; admins see all.
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- products: everyone can read active products; admins can do everything.
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products
  for select using (is_active = true or public.is_admin());

drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- settings: everyone can read; admins can write.
drop policy if exists "settings public read" on public.settings;
create policy "settings public read" on public.settings
  for select using (true);

drop policy if exists "settings admin write" on public.settings;
create policy "settings admin write" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- SEED PRODUCTS (from the existing storefront data; keeps ids 1..8)
-- =====================================================================
insert into public.products
  (id, name, price, original_price, image, category, colors, sizes, description, trending, new_arrival, sort_order)
values
  ('1','Obsidian Oversized Tee',89,120,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop','T-Shirts',array['Black','White','Grey'],array['S','M','L','XL','XXL'],'Premium heavyweight cotton oversized tee with minimalist branding. Crafted for the modern man who values quality and style.',true,false,1),
  ('2','Midnight Silk Shirt',195,null,'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=750&fit=crop','Shirts',array['Black','Navy'],array['S','M','L','XL'],'Luxurious silk blend shirt with a relaxed fit. Perfect for evening occasions.',true,false,2),
  ('3','Shadow Tech Hoodie',245,null,'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=750&fit=crop','Hoodies',array['Black','Charcoal'],array['S','M','L','XL','XXL'],'Technical fabric hoodie with water-resistant coating. Urban meets function.',true,true,3),
  ('4','Noir Slim Jeans',175,null,'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop','Jeans',array['Black','Dark Grey'],array['28','30','32','34','36'],'Japanese selvedge denim in a modern slim fit. Raw and refined.',false,false,4),
  ('5','Titan Chain Bracelet',135,null,'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=750&fit=crop','Accessories',array['Silver','Gold'],array['One Size'],'Surgical steel chain bracelet with matte finish. Bold statement piece.',false,true,5),
  ('6','Eclipse Bomber Jacket',395,450,'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=750&fit=crop','Hoodies',array['Black'],array['S','M','L','XL'],'Premium nylon bomber with satin lining. The ultimate layering piece.',true,false,6),
  ('7','Phantom Graphic Tee',75,null,'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop','T-Shirts',array['Black','White'],array['S','M','L','XL'],'Limited edition graphic tee featuring exclusive artwork. 100% organic cotton.',true,false,7),
  ('8','Stealth Cargo Pants',210,null,'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=750&fit=crop','Jeans',array['Black','Olive'],array['28','30','32','34','36'],'Tapered cargo pants with concealed pockets. Military precision meets streetwear.',true,true,8)
on conflict (id) do nothing;

-- Seed default site settings (hero text etc. — used by Phase 2 controls).
insert into public.settings (key, value) values
  ('hero', '{"title":"ONLY GODS","subtitle":"Premium pieces designed for the elite.","cta":"Shop Now"}'::jsonb),
  ('store', '{"name":"ONLY GODS","currency":"USD","currency_symbol":"$"}'::jsonb)
on conflict (key) do nothing;
