import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeFooter } from '@/lib/footer';
import FooterForm from '../FooterForm';

export const dynamic = 'force-dynamic';

export default async function FooterSettingsPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!.from('settings').select('value').eq('key', 'footer').single();
  return (
    <div>
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft size={15} /> Settings
      </Link>
      <FooterForm initial={mergeFooter(data?.value)} />
    </div>
  );
}
