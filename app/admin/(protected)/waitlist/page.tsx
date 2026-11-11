import { getServerSupabase } from '@/lib/supabase/server';
import WaitlistManager, { type WaitRow } from './WaitlistManager';
import FavouritesList, { type FavRow } from './FavouritesList';

export const dynamic = 'force-dynamic';

export default async function WaitlistPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!
    .from('stock_notifications')
    .select('id, product_id, phone, name, notified, created_at, products(name, stock)')
    .order('created_at', { ascending: false });

  const rows: WaitRow[] = (data ?? []).map((raw) => {
    const r = raw as unknown as {
      id: string; product_id: string; phone: string | null; name: string | null; notified: boolean; created_at: string;
      products: { name: string; stock: number | null } | { name: string; stock: number | null }[] | null;
    };
    const p = Array.isArray(r.products) ? r.products[0] : r.products;
    return {
      id: r.id, product_id: r.product_id, phone: r.phone, name: r.name, notified: r.notified, created_at: r.created_at,
      product_name: p?.name ?? '—', product_stock: Number(p?.stock) || 0,
    };
  });

  // Customer favourites (❤️), grouped by product.
  const { data: favs, error: favErr } = await supabase!
    .from('wishlist')
    .select('product_id, created_at, customers(name, phone)')
    .order('created_at', { ascending: false });
  // wishlist.product_id has no foreign key to products → look the products up separately.
  const favIds = Array.from(new Set((favs ?? []).map((f) => (f as { product_id: string }).product_id)));
  const { data: favProducts } = favIds.length
    ? await supabase!.from('products').select('id, name, image, images').in('id', favIds)
    : { data: [] };
  const productById = new Map(
    ((favProducts ?? []) as { id: string; name: string; image: string | null; images: string[] | null }[]).map((p) => [p.id, p]),
  );
  const groups = new Map<string, FavRow>();
  for (const raw of favs ?? []) {
    const f = raw as unknown as {
      product_id: string; created_at: string;
      customers: { name: string | null; phone: string | null } | { name: string | null; phone: string | null }[] | null;
    };
    const c = Array.isArray(f.customers) ? f.customers[0] : f.customers;
    const p = productById.get(f.product_id);
    const g = groups.get(f.product_id) ?? {
      product_id: f.product_id, product_name: p?.name ?? '(deleted product)', image: p?.images?.[0] || p?.image || null, customers: [],
    };
    g.customers.push({ name: c?.name ?? null, phone: c?.phone ?? null, at: f.created_at });
    groups.set(f.product_id, g);
  }
  const favRows = Array.from(groups.values()).sort((a, b) => b.customers.length - a.customers.length);

  return (
    <div>
      <FavouritesList rows={favRows} error={favErr ? `Could not read favourites: ${favErr.message}` : null} />
      <WaitlistManager initialRows={rows} />
    </div>
  );
}
