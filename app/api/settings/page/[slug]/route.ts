import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergePageContent, isPageSlug, DEFAULT_PAGES } from '@/lib/pageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isPageSlug(slug)) return NextResponse.json({ error: 'Unknown page' }, { status: 404 });

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ page: DEFAULT_PAGES[slug] });
  const { data } = await supabase.from('settings').select('value').eq('key', `page_${slug}`).single();
  return NextResponse.json({ page: mergePageContent(data?.value, slug) });
}
