import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeAnnouncement } from '@/lib/announcement';
import AnnouncementForm from '../AnnouncementForm';

export const dynamic = 'force-dynamic';

export default async function AnnouncementSettingsPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!.from('settings').select('value').eq('key', 'announcement').single();
  return (
    <div>
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft size={15} /> Settings
      </Link>
      <AnnouncementForm initial={mergeAnnouncement(data?.value)} />
    </div>
  );
}
