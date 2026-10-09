import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCategories } from '@/lib/categories';
import CategoriesManager from './CategoriesManager';

export const dynamic = 'force-dynamic';

export default async function CategoriesAdminPage() {
  const supabase = await getServerSupabase();
  const [{ data: settingRow }, { data: products }] = await Promise.all([
    supabase!.from('settings').select('value').eq('key', 'categories').single(),
    supabase!.from('products').select('category').eq('is_active', true),
  ]);

  const categories = mergeCategories(settingRow?.value);
  const counts: Record<string, number> = {};
  for (const p of products ?? []) {
    const c = (p as { category: string | null }).category;
    if (c) counts[c] = (counts[c] ?? 0) + 1;
  }

  return <CategoriesManager initialCategories={categories} counts={counts} />;
}
