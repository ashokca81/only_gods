import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeHero } from '@/lib/hero';
import HeroSettingsForm from '../HeroSettingsForm';

export const dynamic = 'force-dynamic';

export default async function HeroSettingsPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!.from('settings').select('value').eq('key', 'hero').single();
  return (
    <div>
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft size={15} /> Settings
      </Link>
      <HeroSettingsForm initialHero={mergeHero(data?.value)} />
    </div>
  );
}
