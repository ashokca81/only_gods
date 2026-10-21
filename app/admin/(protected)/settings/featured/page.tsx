import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeFeatured } from '@/lib/featured';
import FeaturedForm from '../FeaturedForm';

export const dynamic = 'force-dynamic';

export default async function FeaturedSettingsPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!.from('settings').select('value').eq('key', 'home_featured_products').single();
  const featured = mergeFeatured(data?.value);
  return (
    <div>
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft size={15} /> Settings
      </Link>
      <FeaturedForm initialIds={featured.ids} initialDesktop={featured.desktopEnabled} initialMobile={featured.mobileEnabled} />
    </div>
  );
}
