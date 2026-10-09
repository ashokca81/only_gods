import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeHomeCollection, DEFAULT_HOME_COLLECTION } from '@/lib/homeCollection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ homeCollection: DEFAULT_HOME_COLLECTION });
  const { data } = await supabase.from('settings').select('value').eq('key', 'home_collection').single();
  return NextResponse.json({ homeCollection: mergeHomeCollection(data?.value) });
}
