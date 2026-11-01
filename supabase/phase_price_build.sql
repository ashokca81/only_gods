-- =====================================================================
-- Price builder: per-product shipping + GST folded into ONE customer price.
-- Admin enters base price + shipping + GST %; the app stores the final
-- customer price in products.price / variants[].price (base kept in
-- variants[].base_price). Existing products: price_build = false → unchanged.
-- Also removes the old order-level "₹99 below ₹2000" shipping rule, editing
-- ONLY that expression inside the live functions. Idempotent.
-- =====================================================================
alter table public.products add column if not exists shipping_charge numeric not null default 0;
alter table public.products add column if not exists price_build boolean not null default false;

do $$
declare
  fn text; d text; n text;
  old_expr constant text := 'case when v_subtotal >= 2000 then 0 else 99 end';
begin
  foreach fn in array array['public.quote_order(jsonb,text,text)', 'public.place_order(jsonb,jsonb,text,uuid,text)'] loop
    d := pg_get_functiondef(fn::regprocedure);
    if position(old_expr in d) > 0 then
      n := replace(d, old_expr, '0');
      execute n;
    elsif position('v_shipping := 0;' in d) = 0 then
      raise exception 'shipping rule not found in %', fn;
    end if;
  end loop;
end $$;

select 'price build done' as status,
  position('else 99' in pg_get_functiondef('public.quote_order(jsonb,text,text)'::regprocedure)) = 0 as quote_ok,
  position('else 99' in pg_get_functiondef('public.place_order(jsonb,jsonb,text,uuid,text)'::regprocedure)) = 0 as place_ok;
