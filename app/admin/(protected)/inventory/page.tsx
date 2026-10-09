import { getServerSupabase } from '@/lib/supabase/server';
import InventoryManager, { type InventoryRow } from './InventoryManager';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!
    .from('products')
    .select('id, name, category, image, stock, reorder_level, is_active, variants')
    .order('stock', { ascending: true });

  const rows: InventoryRow[] = (data ?? []).map((p) => {
    const variants = (p as { variants: unknown[] | null }).variants ?? [];
    return {
      id: (p as { id: string }).id,
      name: (p as { name: string }).name,
      category: (p as { category: string | null }).category,
      image: (p as { image: string | null }).image,
      stock: Number((p as { stock: number | null }).stock) || 0,
      reorder_level: Number((p as { reorder_level: number | null }).reorder_level) || 0,
      is_active: (p as { is_active: boolean | null }).is_active !== false,
      hasVariants: Array.isArray(variants) && variants.some((v) => ((v as { color?: string })?.color ?? '').trim() !== ''),
    };
  });

  return <InventoryManager initialRows={rows} />;
}
