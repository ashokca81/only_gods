import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeFlash, DEFAULT_FLASH } from '@/lib/flash';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ flash: DEFAULT_FLASH });
  const { data } = await supabase.from('settings').select('value').eq('key', 'flash_sale').single();
  return NextResponse.json({ flash: mergeFlash(data?.value) });
}
