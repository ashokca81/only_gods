import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeHomeProducts } from '@/lib/homeProducts';

export const runtime = 'nodejs';

/** Save the home product-grid selection. Admin only. Body: { homeProducts: { ids } }. */
export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const homeProducts = mergeHomeProducts(body?.homeProducts);

  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'home_products', value: homeProducts }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ homeProducts });
}
