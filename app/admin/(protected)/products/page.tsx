import { getServerSupabase } from '@/lib/supabase/server';
import type { ProductRow } from '@/lib/products-map';
import ProductsManager from './ProductsManager';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return <ProductsManager initialProducts={(data ?? []) as ProductRow[]} />;
}
