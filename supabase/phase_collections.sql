-- =====================================================================
-- COLLECTIONS tag on products (season-wise groups, independent of category).
-- Additive & idempotent. A product can belong to many collections.
-- =====================================================================
alter table public.products
  add column if not exists collections text[] not null default '{}';

-- Optional: speed up "products in a collection" lookups.
create index if not exists products_collections_idx
  on public.products using gin (collections);
