-- =====================================================================
-- Shipping-label QR → public /o/<order_no> page. Returns ONLY the products in
-- an order (no customer name/phone/address/prices). Secret-gated, so it is
-- called from our server only. Idempotent.
-- =====================================================================
create or replace function public.order_public_items(p_secret text, p_order_no text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_id uuid;
begin
  perform public.chk_secret(p_secret);
  select id into v_id from public.orders where order_no = p_order_no;
  if v_id is null then return null; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'product_id', i.product_id,
             'name', i.name,
             'image', coalesce(nullif(p.image, ''), i.image),
             'size', i.size,
             'color', i.color,
             'quantity', i.quantity,
             'available', coalesce(p.is_active, false)
           ) order by i.name)
      from public.order_items i
      left join public.products p on p.id = i.product_id
     where i.order_id = v_id
  ), '[]'::jsonb);
end; $$;

grant execute on function public.order_public_items(text, text) to anon, authenticated;

select 'order qr done' as status;
