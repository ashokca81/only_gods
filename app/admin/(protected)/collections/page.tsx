import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCollections } from '@/lib/collections';
import { mergeCategories } from '@/lib/categories';
import CollectionsManager, { type AdminProduct } from './CollectionsManager';

export const dynamic = 'force-dynamic';

export default async function CollectionsAdminPage() {
  const supabase = await getServerSupabase();
  const [{ data: colRow }, { data: catRow }, { data: products }] = await Promise.all([
    supabase!.from('settings').select('value').eq('key', 'collections').single(),
    supabase!.from('settings').select('value').eq('key', 'categories').single(),
    supabase!.from('products').select('id, name, image, category, collections, is_active').order('name'),
  ]);

  return (
    <CollectionsManager
      initialCollections={mergeCollections(colRow?.value)}
      categories={mergeCategories(catRow?.value).map((c) => c.name)}
      initialProducts={(products ?? []) as AdminProduct[]}
    />
  );
}
