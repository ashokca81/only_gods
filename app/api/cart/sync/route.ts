import { NextResponse } from 'next/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';

/** Persist the logged-in customer's cart snapshot (for abandoned-cart recovery). */
export async function POST(req: Request) {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ ok: true }); // guests not tracked

  const { items, subtotal } = await req.json().catch(() => ({}));
  try {
    await callRpc('cart_sync', {
      p_cid: cid,
      p_items: Array.isArray(items) ? items : [],
      p_subtotal: Number(subtotal) || 0,
    });
  } catch {
    /* non-critical */
  }
  return NextResponse.json({ ok: true });
}
