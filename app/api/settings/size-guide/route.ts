import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeSizeGuide, DEFAULT_SIZE_GUIDE } from '@/lib/sizeGuide';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ sizeGuide: DEFAULT_SIZE_GUIDE });
  const { data } = await supabase.from('settings').select('value').eq('key', 'size_guide').single();
  return NextResponse.json({ sizeGuide: mergeSizeGuide(data?.value) });
}
