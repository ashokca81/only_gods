import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Set exactly which products are hand-picked into a collection. Admin only.
 * Body: { title: string, productIds: string[] } — products in the list get the
 * tag, every other product loses it. (Category-based members are not tags.)
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  if (!title) return NextResponse.json({ error: 'Missing collection' }, { status: 400 });
  const want = new Set<string>((Array.isArray(body?.productIds) ? body.productIds : []).map(String));

  const { data: products, error } = await supabase.from('products').select('id, collections');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let changed = 0;
  for (const p of (products ?? []) as { id: string; collections: string[] | null }[]) {
    const cur = p.collections ?? [];
    const has = cur.includes(title);
    const should = want.has(String(p.id));
    if (has === should) continue;
    const next = should ? [...cur, title] : cur.filter((t) => t !== title);
    const { error: upErr } = await supabase.from('products').update({ collections: next }).eq('id', p.id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    changed++;
  }

  return NextResponse.json({ ok: true, changed });
}
