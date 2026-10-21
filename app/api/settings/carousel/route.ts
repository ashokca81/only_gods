import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCarousel, DEFAULT_CAROUSEL, mergeCarouselFlags, DEFAULT_CAROUSEL_FLAGS } from '@/lib/carousel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ slides: DEFAULT_CAROUSEL, ...DEFAULT_CAROUSEL_FLAGS });
  const [slidesRow, flagsRow] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'home_carousel').single(),
    supabase.from('settings').select('value').eq('key', 'home_carousel_flags').single(),
  ]);
  return NextResponse.json({
    slides: mergeCarousel(slidesRow.data?.value),
    ...mergeCarouselFlags(flagsRow.data?.value),
  });
}
