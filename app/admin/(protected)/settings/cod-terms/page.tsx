import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCodTerms } from '@/lib/codTerms';
import CodTermsForm from '../CodTermsForm';

export const dynamic = 'force-dynamic';

export default async function CodTermsSettingsPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!.from('settings').select('value').eq('key', 'cod_terms').single();
  return (
    <div>
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft size={15} /> Settings
      </Link>
      <CodTermsForm initial={mergeCodTerms(data?.value)} />
    </div>
  );
}
