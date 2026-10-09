-- =====================================================================
-- GST: product HSN + rate, and a per-order-item snapshot (via the existing
-- order-item trigger, so place_order stays untouched). Idempotent.
-- =====================================================================
alter table public.products    add column if not exists hsn      text;
alter table public.products    add column if not exists gst_rate numeric;
alter table public.order_items add column if not exists hsn      text;
alter table public.order_items add column if not exists gst_rate numeric;

-- Extend the order-item snapshot trigger to also capture cost + HSN + GST rate.
create or replace function public.set_order_item_cost() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if new.product_id is not null then
    select cost_price, hsn, gst_rate into p from public.products where id = new.product_id;
    if new.cost is null then new.cost := p.cost_price; end if;
    if new.hsn is null then new.hsn := p.hsn; end if;
    if new.gst_rate is null then new.gst_rate := p.gst_rate; end if;
  end if;
  return new;
end; $$;

-- (Trigger order_items_cost_trg already exists from phase_cost and now runs this updated fn.)

select 'gst done' as status;
