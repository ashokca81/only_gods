import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';
import type { ProductRow } from '@/lib/products-map';
import ProductForm from '../../ProductForm';
import { rowToInput } from '../../product-defaults';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const { data } = await supabase!.from('products').select('*').eq('id', id).single();
  if (!data) redirect('/admin/products');
  return <ProductForm initial={rowToInput(data as ProductRow)} productId={id} />;
}
