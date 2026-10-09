-- =====================================================================
-- Returns / refunds. Customer requests on a delivered order; admin reviews.
-- Idempotent.
-- =====================================================================
create table if not exists public.returns (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid unique references public.orders(id) on delete cascade,
  customer_id   uuid references public.customers(id) on delete set null,
  reason        text not null,
  comment       text,
  status        text not null default 'requested', -- requested | approved | rejected | refunded
  refund_amount numeric,
  created_at    timestamptz not null default now()
);

alter table public.returns enable row level security;
drop policy if exists "returns admin all" on public.returns;
create policy "returns admin all" on public.returns
  for all using (public.is_admin()) with check (public.is_admin());

-- Customer requests a return (secret-gated). Only for their own, delivered order.
create or replace function public.request_return(p_secret text, p_cid uuid, p_order_id uuid, p_reason text, p_comment text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_status text; v_exists text;
begin
  perform public.chk_secret(p_secret);
  if p_cid is null then raise exception 'login required'; end if;
  select status into v_status from public.orders where id = p_order_id and customer_id = p_cid;
  if v_status is null then raise exception 'Order not found'; end if;
  if v_status <> 'delivered' then raise exception 'Returns are allowed only after delivery'; end if;
  select status into v_exists from public.returns where order_id = p_order_id;
  if v_exists is not null then return jsonb_build_object('ok', true, 'status', v_exists, 'already', true); end if;
  insert into public.returns (order_id, customer_id, reason, comment, status)
    values (p_order_id, p_cid, coalesce(nullif(trim(p_reason), ''), 'Other'), nullif(trim(p_comment), ''), 'requested');
  return jsonb_build_object('ok', true, 'status', 'requested');
end; $$;

grant execute on function public.request_return(text, uuid, uuid, text, text) to anon, authenticated;

-- Recreate customer_orders to also expose the return status.
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
             (select r.status from public.returns r where r.order_id = ord.id limit 1) as return_status,
             coalesce((select jsonb_agg(jsonb_build_object('name', oi.name, 'image', oi.image,
                       'price', oi.price, 'quantity', oi.quantity, 'size', oi.size, 'color', oi.color))
                       from public.order_items oi where oi.order_id = ord.id), '[]'::jsonb) as items
      from public.orders ord where ord.customer_id = p_cid order by ord.created_at desc
    ) t
  ), '[]'::jsonb);
end; $$;

grant execute on function public.customer_orders(text, uuid) to anon, authenticated;

select 'returns done' as status;
