import { NextResponse } from 'next/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';

export async function GET() {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ customer: null });
  try {
    const customer = await callRpc('customer_get', { p_cid: cid });
    return NextResponse.json({ customer });
  } catch {
    return NextResponse.json({ customer: null });
  }
}
