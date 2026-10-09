import { NextResponse } from 'next/server';
import { callRpc } from '@/lib/customer-rpc';
import { sendOtpSms } from '@/lib/msg91';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { phone } = await req.json().catch(() => ({}));
  const p = String(phone || '').replace(/\D/g, '');
  if (p.length < 10) {
    return NextResponse.json({ error: 'Enter a valid 10-digit mobile number' }, { status: 400 });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    await callRpc('otp_set', { p_phone: p, p_code: code });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
  const sms = await sendOtpSms(p, code);
  // devCode is only returned when real SMS isn't configured (test mode).
  return NextResponse.json({ ok: true, sent: sms.sent, devCode: sms.sent ? undefined : code });
}
