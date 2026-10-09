import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeHomeCollection } from '@/lib/homeCollection';
import { mergeCategories } from '@/lib/categories';
import HomeCollectionForm from '../HomeCollectionForm';

export const dynamic = 'force-dynamic';

export default async function CollectionSectionSettingsPage() {
  const supabase = await getServerSupabase();
  const [{ data: homeColRow }, { data: categoriesRow }] = await Promise.all([
    supabase!.from('settings').select('value').eq('key', 'home_collection').single(),
    supabase!.from('settings').select('value').eq('key', 'categories').single(),
  ]);
  return (
    <div>
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft size={15} /> Settings
      </Link>
      <HomeCollectionForm
        initial={mergeHomeCollection(homeColRow?.value)}
        allCategories={mergeCategories(categoriesRow?.value)}
      />
    </div>
  );
}
