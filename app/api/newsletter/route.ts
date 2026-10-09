import { NextResponse } from 'next/server';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';

/** Subscribe an email to the newsletter. Public (no login). Body: { email, source? }. */
export async function POST(req: Request) {
  const { email, source } = await req.json().catch(() => ({}));
  const e = typeof email === 'string' ? email.trim() : '';
  if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 });
  }
  try {
    await callRpc('subscribe_newsletter', {
      p_email: e,
      p_source: typeof source === 'string' && source.trim() !== '' ? source.trim() : null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
