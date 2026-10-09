-- =====================================================================
-- Order shipping / tracking: courier + tracking no + link, shown to customer.
-- Idempotent.
-- =====================================================================
alter table public.orders add column if not exists courier         text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url    text;

-- Recreate customer_orders so customers can see status + tracking.
create or replace function public.customer_orders(p_secret text, p_cid uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.chk_secret(p_secret);
  return coalesce((
    select jsonb_agg(row_to_json(t)) from (
      select ord.id, ord.order_no, ord.status, ord.total, ord.subtotal, ord.shipping, ord.discount,
             ord.payment_method, ord.payment_status, ord.created_at,
             ord.address_line, ord.city, ord.state, ord.pincode,
             ord.courier, ord.tracking_number, ord.tracking_url,
             coalesce((select jsonb_agg(jsonb_build_object('name', oi.name, 'image', oi.image,
                       'price', oi.price, 'quantity', oi.quantity, 'size', oi.size, 'color', oi.color))
                       from public.order_items oi where oi.order_id = ord.id), '[]'::jsonb) as items
      from public.orders ord where ord.customer_id = p_cid order by ord.created_at desc
    ) t
  ), '[]'::jsonb);
end; $$;

grant execute on function public.customer_orders(text, uuid) to anon, authenticated;

select 'shipping done' as status;
