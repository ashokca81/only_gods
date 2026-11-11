import { NextResponse } from 'next/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ items: [] });
  const items = ((await callRpc('wishlist_list', { p_cid: cid })) ?? []) as { id: string; image: string }[];
  // Show the product's first photo (what the home/shop cards show), not the old cover.
  if (items.length) {
    const supabase = await getServerSupabase();
    const { data } = supabase
      ? await supabase.from('products').select('id, images').in('id', items.map((i) => i.id))
      : { data: null };
    const first = new Map(((data ?? []) as { id: string; images: string[] | null }[]).map((p) => [p.id, p.images?.[0]]));
    for (const it of items) it.image = first.get(it.id) || it.image;
  }
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Please log in to save favourites' }, { status: 401 });
  const { product_id } = await req.json().catch(() => ({}));
  if (!product_id) return NextResponse.json({ error: 'Missing product' }, { status: 400 });
  const result = await callRpc('wishlist_toggle', { p_cid: cid, p_pid: String(product_id) });
  return NextResponse.json(result);
}
