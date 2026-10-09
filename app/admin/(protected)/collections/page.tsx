import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCollections } from '@/lib/collections';
import CollectionsManager from './CollectionsManager';

export const dynamic = 'force-dynamic';

export default async function CollectionsAdminPage() {
  const supabase = await getServerSupabase();
  const [{ data: colRow }, { data: products }] = await Promise.all([
    supabase!.from('settings').select('value').eq('key', 'collections').single(),
    supabase!.from('products').select('collections').eq('is_active', true),
  ]);

  const collections = mergeCollections(colRow?.value);

  // Live count of products tagged into each collection.
  const counts: Record<string, number> = {};
  for (const p of products ?? []) {
    for (const name of ((p as { collections: string[] | null }).collections ?? [])) {
      counts[name] = (counts[name] ?? 0) + 1;
    }
  }

  return <CollectionsManager initialCollections={collections} counts={counts} />;
}
