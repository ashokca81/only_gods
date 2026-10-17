import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeThemeSchedule, DEFAULT_THEME_SCHEDULE } from '@/lib/themeSchedule';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ themeSchedule: DEFAULT_THEME_SCHEDULE });
  const { data } = await supabase.from('settings').select('value').eq('key', 'theme_schedule').single();
  return NextResponse.json({ themeSchedule: mergeThemeSchedule(data?.value) });
}
