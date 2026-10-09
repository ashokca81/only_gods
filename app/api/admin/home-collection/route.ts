import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeHomeCollection } from '@/lib/homeCollection';

export const runtime = 'nodejs';

/** Save the home "The Collection" section. Admin only. Body: { homeCollection: HomeCollection }. */
export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const homeCollection = mergeHomeCollection(body?.homeCollection);

  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'home_collection', value: homeCollection }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ homeCollection });
}
