import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeHero, DEFAULT_HERO } from '@/lib/hero';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ hero: DEFAULT_HERO });
  const { data } = await supabase.from('settings').select('value').eq('key', 'hero').single();
  return NextResponse.json({ hero: mergeHero(data?.value) });
}
