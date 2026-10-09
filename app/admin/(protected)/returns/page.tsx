import { getServerSupabase } from '@/lib/supabase/server';
import ReturnsManager, { type ReturnRow } from './ReturnsManager';

export const dynamic = 'force-dynamic';

export default async function ReturnsPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!
    .from('returns')
    .select('id, order_id, reason, comment, status, refund_amount, created_at, orders(order_no, customer_name, customer_phone, total)')
    .order('created_at', { ascending: false });

  const rows: ReturnRow[] = (data ?? []).map((raw) => {
    const r = raw as unknown as {
      id: string; order_id: string; reason: string; comment: string | null; status: string;
      refund_amount: number | null; created_at: string;
      orders: { order_no: string; customer_name: string; customer_phone: string; total: number } | { order_no: string; customer_name: string; customer_phone: string; total: number }[] | null;
    };
    const ord = Array.isArray(r.orders) ? r.orders[0] : r.orders;
    return {
      id: r.id, order_id: r.order_id, reason: r.reason, comment: r.comment, status: r.status,
      refund_amount: r.refund_amount, created_at: r.created_at,
      order_no: ord?.order_no ?? '—', customer_name: ord?.customer_name ?? '—',
      customer_phone: ord?.customer_phone ?? '', order_total: Number(ord?.total) || 0,
    };
  });

  return <ReturnsManager initialReturns={rows} />;
}
