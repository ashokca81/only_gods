import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCategories, DEFAULT_CATEGORIES } from '@/lib/categories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ categories: DEFAULT_CATEGORIES });
  const { data } = await supabase.from('settings').select('value').eq('key', 'categories').single();
  return NextResponse.json({ categories: mergeCategories(data?.value) });
}
