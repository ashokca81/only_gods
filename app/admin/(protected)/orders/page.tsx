import { getServerSupabase } from '@/lib/supabase/server';
import OrdersManager, { type OrderRow } from './OrdersManager';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  return <OrdersManager initialOrders={(data ?? []) as OrderRow[]} />;
}
