import { NextResponse } from 'next/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';

export async function GET() {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ items: [] });
  const items = await callRpc('wishlist_list', { p_cid: cid });
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
