import { NextResponse } from 'next/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';

export async function GET() {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  const orders = await callRpc('customer_orders', { p_cid: cid });
  return NextResponse.json({ orders });
}
