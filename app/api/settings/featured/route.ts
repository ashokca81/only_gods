import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeFeatured, DEFAULT_FEATURED } from '@/lib/featured';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ featured: DEFAULT_FEATURED });
  const { data } = await supabase.from('settings').select('value').eq('key', 'home_featured_products').single();
  return NextResponse.json({ featured: mergeFeatured(data?.value) });
}
