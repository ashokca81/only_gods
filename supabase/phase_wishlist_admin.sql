-- =====================================================================
-- Admin can READ customer favourites (wishlist) for the dashboard Wishlist
-- page. Customers still use the secret-gated RPCs. Idempotent, read-only.
-- =====================================================================
drop policy if exists "wishlist admin read" on public.wishlist;
create policy "wishlist admin read" on public.wishlist
  for select using (public.is_admin());

select 'wishlist admin done' as status;
