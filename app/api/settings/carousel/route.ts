import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCarousel, DEFAULT_CAROUSEL } from '@/lib/carousel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ slides: DEFAULT_CAROUSEL });
  const { data } = await supabase.from('settings').select('value').eq('key', 'home_carousel').single();
  return NextResponse.json({ slides: mergeCarousel(data?.value) });
}
