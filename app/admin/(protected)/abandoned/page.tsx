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

  return <AbandonedManager initialRows={rows} />;
}
