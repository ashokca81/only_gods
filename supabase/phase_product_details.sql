-- =====================================================================
-- Product "Details & Care" (bullet lines) + "Shipping & Returns" text.
-- Additive & idempotent.
-- =====================================================================
alter table public.products
  add column if not exists details_care     text[] not null default '{}',
  add column if not exists shipping_returns text;
