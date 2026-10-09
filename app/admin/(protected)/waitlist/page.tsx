import { getServerSupabase } from '@/lib/supabase/server';
import WaitlistManager, { type WaitRow } from './WaitlistManager';

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

  return <WaitlistManager initialRows={rows} />;
}
