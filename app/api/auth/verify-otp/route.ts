import { NextResponse } from 'next/server';
import { callRpc } from '@/lib/customer-rpc';
import { setCustomerSession } from '@/lib/customer-session';

export const runtime = 'nodejs';

interface CustomerRow { id: string; phone: string; name: string | null; avatar_url: string | null }

export async function POST(req: Request) {
  const { phone, code } = await req.json().catch(() => ({}));
  const p = String(phone || '').replace(/\D/g, '');
  const c = String(code || '').trim();
  if (p.length < 10 || c.length < 4) {
    return NextResponse.json({ error: 'Enter the OTP' }, { status: 400 });
  }
  try {
    const customer = await callRpc<CustomerRow>('otp_verify', { p_phone: p, p_code: c });
    await setCustomerSession(customer.id, customer.phone);
    return NextResponse.json({ customer });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid code' }, { status: 400 });
  }
}
