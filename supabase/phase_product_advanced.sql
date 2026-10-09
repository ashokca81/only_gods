-- Advanced product fields (additive, safe).
alter table public.products
  add column if not exists videos text[] not null default '{}',
  add column if not exists sku text,
  add column if not exists stock integer not null default 0,
  add column if not exists brand text,
  add column if not exists tags text[] not null default '{}';

select 'done' as status;
