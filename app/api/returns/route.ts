import { NextResponse } from 'next/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';

/** Customer requests a return on their delivered order. */
export async function POST(req: Request) {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Please log in' }, { status: 401 });

  const { orderId, reason, comment } = await req.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: 'Missing order' }, { status: 400 });
  if (!reason) return NextResponse.json({ error: 'Please choose a reason' }, { status: 400 });

  try {
    const data = await callRpc('request_return', {
      p_cid: cid,
      p_order_id: String(orderId),
      p_reason: String(reason),
      p_comment: comment ?? null,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not submit' }, { status: 400 });
  }
}
