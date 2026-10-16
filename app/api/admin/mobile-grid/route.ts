import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeMobileGrid } from '@/lib/mobileGrid';

export const runtime = 'nodejs';

/** Save the mobile 2x2 product grid. Admin only. Body: { mobileGrid: { ids } }. */
export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const mobileGrid = mergeMobileGrid(body?.mobileGrid);

  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'mobile_grid_products', value: mobileGrid }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mobileGrid });
}
