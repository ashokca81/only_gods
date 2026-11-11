import { getServerSupabase } from '@/lib/supabase/server';
import AbandonedManager, { type CartRow } from './AbandonedManager';

export const dynamic = 'force-dynamic';

export default async function AbandonedPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!
    .from('carts')
    .select('customer_id, items, subtotal, updated_at, customers(name, phone)')
    .order('updated_at', { ascending: false });

  const rows: CartRow[] = (data ?? [])
    .map((raw) => {
      const r = raw as unknown as {
        customer_id: string; items: { name: string; quantity: number }[] | null; subtotal: number; updated_at: string;
        customers: { name: string | null; phone: string | null } | { name: string | null; phone: string | null }[] | null;
      };
      const cust = Array.isArray(r.customers) ? r.customers[0] : r.customers;
      return {
        customer_id: r.customer_id,
        name: cust?.name ?? null,
        phone: cust?.phone ?? null,
        items: (r.items ?? []).map((i) => ({ name: i.name, quantity: i.quantity })),
        subtotal: Number(r.subtotal) || 0,
        updated_at: r.updated_at,
      };
    })
    .filter((r) => r.items.length > 0);

  // Hide carts that were already bought: the customer has a (not cancelled)
  // order containing every cart item. Old carts kept re-syncing after purchase,
  // so their date can be later than the order — no time limit.
  const ids = rows.map((r) => r.customer_id);
  const { data: orders } = ids.length
    ? await supabase!.from('orders').select('customer_id, status, order_items(name)').in('customer_id', ids)
    : { data: [] };
  const bought = (r: CartRow) =>
    (orders ?? []).some((raw) => {
      const o = raw as unknown as { customer_id: string; status: string | null; order_items: { name: string }[] | null };
      if (o.customer_id !== r.customer_id || o.status === 'cancelled') return false;
      const names = new Set((o.order_items ?? []).map((i) => i.name));
      return r.items.every((i) => names.has(i.name));
    });

  return <AbandonedManager initialRows={rows.filter((r) => !bought(r))} />;
}
