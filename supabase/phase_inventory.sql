-- =====================================================================
-- Inventory: per-product reorder level + stock movement audit log.
-- Additive & idempotent.
-- =====================================================================
alter table public.products
  add column if not exists reorder_level integer not null default 5;

create table if not exists public.stock_movements (
  id          uuid primary key default gen_random_uuid(),
  product_id  text references public.products(id) on delete cascade,
  change      integer not null,          -- +in / -out
  new_stock   integer not null,          -- resulting stock after change
  reason      text not null default 'manual', -- manual | sale | return | correction
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.stock_movements enable row level security;
drop policy if exists "stock_movements admin all" on public.stock_movements;
create policy "stock_movements admin all" on public.stock_movements
  for all using (public.is_admin()) with check (public.is_admin());

create index if not exists stock_movements_product_idx
  on public.stock_movements(product_id, created_at desc);
