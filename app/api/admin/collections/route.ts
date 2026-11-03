import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCollections } from '@/lib/collections';

export const runtime = 'nodejs';

type Rename = { from: string; to: string };

/**
 * Save the storefront Collections. Admin only.
 * Body: { collections: Collection[], renames?: {from,to}[], removed?: string[] }
 * Renamed/removed collections are also updated on product tags and on the
 * Runway / Home collection selections, so nothing keeps pointing at an old name.
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const collections = mergeCollections(body?.collections);
  const titles = new Set(collections.map((c) => c.title));
  const renames: Rename[] = (Array.isArray(body?.renames) ? body.renames : [])
    .filter((r: Rename) => typeof r?.from === 'string' && typeof r?.to === 'string' && r.from.trim() && r.to.trim() && r.from !== r.to)
    .map((r: Rename) => ({ from: r.from.trim(), to: r.to.trim() }));
  const removed: string[] = (Array.isArray(body?.removed) ? body.removed : [])
    .filter((t: unknown): t is string => typeof t === 'string' && t.trim() !== '' && !titles.has(t.trim()))
    .map((t: string) => t.trim());

  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'collections', value: collections }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (renames.length || removed.length) {
    const map = new Map(renames.map((r) => [r.from, r.to]));
    const fix = (list: string[]) => {
      const out: string[] = [];
      for (const t of list) {
        if (removed.includes(t)) continue;
        const n = map.get(t) ?? t;
        if (!out.includes(n)) out.push(n);
      }
      return out;
    };

    // Product tags
    const { data: products } = await supabase.from('products').select('id, collections');
    for (const p of (products ?? []) as { id: string; collections: string[] | null }[]) {
      const cur = p.collections ?? [];
      if (!cur.length) continue;
      const next = fix(cur);
      if (next.length !== cur.length || next.some((t, i) => t !== cur[i])) {
        await supabase.from('products').update({ collections: next }).eq('id', p.id);
      }
    }

    // Runway + Home collection selections store titles too
    for (const key of ['runway_collections', 'home_collection']) {
      const { data: row } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
      const v = row?.value as { titles?: string[] } | null;
      if (v && Array.isArray(v.titles) && v.titles.length) {
        const next = fix(v.titles);
        if (next.join('\u0000') !== v.titles.join('\u0000')) {
          await supabase.from('settings').upsert({ key, value: { ...v, titles: next } }, { onConflict: 'key' });
        }
      }
    }
  }

  return NextResponse.json({ collections });
}
