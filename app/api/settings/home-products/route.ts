import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeHomeProducts, DEFAULT_HOME_PRODUCTS } from '@/lib/homeProducts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ homeProducts: DEFAULT_HOME_PRODUCTS });
  const { data } = await supabase.from('settings').select('value').eq('key', 'home_products').single();
  return NextResponse.json({ homeProducts: mergeHomeProducts(data?.value) });
}
