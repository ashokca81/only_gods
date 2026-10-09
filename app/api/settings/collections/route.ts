import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCollections, DEFAULT_COLLECTIONS } from '@/lib/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ collections: DEFAULT_COLLECTIONS });
  const { data } = await supabase.from('settings').select('value').eq('key', 'collections').single();
  return NextResponse.json({ collections: mergeCollections(data?.value) });
}
