import { NextResponse } from 'next/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  const { name, avatar_url } = await req.json().catch(() => ({}));
  await callRpc('customer_update', { p_cid: cid, p_name: name ?? null, p_avatar: avatar_url ?? null });
  const customer = await callRpc('customer_get', { p_cid: cid });
  return NextResponse.json({ customer });
}
