import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeAnnouncement, DEFAULT_ANNOUNCEMENT } from '@/lib/announcement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ announcement: DEFAULT_ANNOUNCEMENT });
  const { data } = await supabase.from('settings').select('value').eq('key', 'announcement').single();
  return NextResponse.json({ announcement: mergeAnnouncement(data?.value) });
}
