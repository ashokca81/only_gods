import { NextResponse } from 'next/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'login' }, { status: 401 });
  const { productId } = await req.json().catch(() => ({}));
  if (!productId) return NextResponse.json({ error: 'Missing product' }, { status: 400 });
  try {
    await callRpc('request_stock_notify', { p_cid: cid, p_product: String(productId) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not submit' }, { status: 400 });
  }
}
