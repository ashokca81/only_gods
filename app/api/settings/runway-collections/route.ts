import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeRunwaySelection, DEFAULT_RUNWAY_SELECTION } from '@/lib/runwayCollections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ runway: DEFAULT_RUNWAY_SELECTION });
  const { data } = await supabase.from('settings').select('value').eq('key', 'runway_collections').single();
  return NextResponse.json({ runway: mergeRunwaySelection(data?.value) });
}
