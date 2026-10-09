import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCollections } from '@/lib/collections';
import { mergeRunwaySelection } from '@/lib/runwayCollections';
import RunwayForm from '../RunwayForm';

export const dynamic = 'force-dynamic';

export default async function RunwaySettingsPage() {
  const supabase = await getServerSupabase();
  const [{ data: collectionsRow }, { data: runwayRow }] = await Promise.all([
    supabase!.from('settings').select('value').eq('key', 'collections').single(),
    supabase!.from('settings').select('value').eq('key', 'runway_collections').single(),
  ]);
  return (
    <div>
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft size={15} /> Settings
      </Link>
      <RunwayForm
        initialTitles={mergeRunwaySelection(runwayRow?.value).titles}
        allCollections={mergeCollections(collectionsRow?.value)}
      />
    </div>
  );
}
