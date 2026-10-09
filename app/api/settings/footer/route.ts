import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeFooter, DEFAULT_FOOTER } from '@/lib/footer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ footer: DEFAULT_FOOTER });
  const { data } = await supabase.from('settings').select('value').eq('key', 'footer').single();
  return NextResponse.json({ footer: mergeFooter(data?.value) });
}
