import { getServerSupabase } from '@/lib/supabase/server';
import AnalyticsClient, { type OrderLite, type ProductLite, type CustomerLite } from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await getServerSupabase();

  const [ordersRes, productsRes, customersRes] = await Promise.all([
    supabase!
      .from('orders')
      .select('id, status, subtotal, shipping, total, discount, created_at, customer_phone, customer_name, order_items(product_id, name, price, quantity, cost)')
      .order('created_at', { ascending: true }),
    supabase!.from('products').select('id, name, category, stock, price, is_active'),
    supabase!.from('customers').select('id, created_at'),
  ]);

  return (
    <AnalyticsClient
      orders={(ordersRes.data ?? []) as OrderLite[]}
      products={(productsRes.data ?? []) as ProductLite[]}
      customers={(customersRes.data ?? []) as CustomerLite[]}
    />
  );
}
