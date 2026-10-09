import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getServerSupabase } from '@/lib/supabase/server';
import { isPageSlug, mergePageContent, PAGE_META } from '@/lib/pageContent';
import PageContentForm from '../../PageContentForm';

export const dynamic = 'force-dynamic';

export default async function PageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isPageSlug(slug)) notFound();

  const supabase = await getServerSupabase();
  const { data } = await supabase!.from('settings').select('value').eq('key', `page_${slug}`).single();

  return (
    <div>
      <Link href="/admin/settings/pages" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft size={15} /> Pages
      </Link>
      <PageContentForm slug={slug} label={PAGE_META[slug].label} initial={mergePageContent(data?.value, slug)} />
    </div>
  );
}
