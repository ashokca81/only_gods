-- =====================================================================
-- Profit tracking: product cost price + per-order-item cost snapshot.
-- Snapshot is set by a trigger so place_order stays untouched. Idempotent.
-- =====================================================================
alter table public.products   add column if not exists cost_price numeric;
alter table public.order_items add column if not exists cost       numeric;

-- Snapshot the product's cost onto each order item as it is created, so past
-- orders keep the right profit even if the cost changes later.
create or replace function public.set_order_item_cost() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.cost is null and new.product_id is not null then
    select cost_price into new.cost from public.products where id = new.product_id;
  end if;
  return new;
end; $$;

drop trigger if exists order_items_cost_trg on public.order_items;
create trigger order_items_cost_trg
  before insert on public.order_items
  for each row execute function public.set_order_item_cost();

select 'cost done' as status;
