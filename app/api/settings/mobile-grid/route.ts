import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeMobileGrid, DEFAULT_MOBILE_GRID } from '@/lib/mobileGrid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ mobileGrid: DEFAULT_MOBILE_GRID });
  const { data } = await supabase.from('settings').select('value').eq('key', 'mobile_grid_products').single();
  return NextResponse.json({ mobileGrid: mergeMobileGrid(data?.value) });
}
