import { NextResponse } from 'next/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';

export async function GET() {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  const addresses = await callRpc('customer_addresses', { p_cid: cid });
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  await callRpc('address_save', { p_cid: cid, p: body });
  const addresses = await callRpc('customer_addresses', { p_cid: cid });
  return NextResponse.json({ addresses });
}

export async function DELETE(req: Request) {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await callRpc('address_delete', { p_cid: cid, p_id: id });
  const addresses = await callRpc('customer_addresses', { p_cid: cid });
  return NextResponse.json({ addresses });
}
