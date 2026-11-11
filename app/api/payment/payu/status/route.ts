import { NextResponse } from 'next/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Status of the logged-in customer's own PayU payment: paid | failed | pending. */
export async function GET(req: Request) {
  const cid = await getCustomerId();
  const txnid = new URL(req.url).searchParams.get('txnid') || '';
  if (!cid || !txnid) return NextResponse.json({ status: 'unknown' });
  try {
    const r = await callRpc<{ status: string; order_no: string | null; customer_id: string } | null>('payu_get', { p_txnid: txnid });
    if (!r || r.customer_id !== cid) return NextResponse.json({ status: 'unknown' });
    const status = r.status === 'paid' ? 'paid' : r.status === 'failed' ? 'failed' : 'pending';
    return NextResponse.json({ status, orderNo: r.order_no });
  } catch {
    return NextResponse.json({ status: 'unknown' });
  }
}
