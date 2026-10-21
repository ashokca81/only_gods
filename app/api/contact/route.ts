import { NextResponse } from 'next/server';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';

/** Submit a contact-form message. Public (no login). Body: { name?, email, message }. */
export async function POST(req: Request) {
  const { name, email, message } = await req.json().catch(() => ({}));
  const e = typeof email === 'string' ? email.trim() : '';
  const m = typeof message === 'string' ? message.trim() : '';
  if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 });
  }
  if (!m) {
    return NextResponse.json({ error: 'Please enter a message' }, { status: 400 });
  }
  try {
    await callRpc('submit_contact_message', {
      p_name: typeof name === 'string' && name.trim() !== '' ? name.trim() : null,
      p_email: e,
      p_message: m,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
