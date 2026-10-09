import { cookies } from 'next/headers';
import crypto from 'crypto';

const SECRET = process.env.CUSTOMER_SESSION_SECRET || 'dev-secret';
const COOKIE = 'og_customer';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface Payload { cid: string; phone: string; exp: number }

function sign(payload: Payload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify(token: string): Payload | null {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString()) as Payload;
    if (p.exp && Date.now() > p.exp) return null;
    return p;
  } catch {
    return null;
  }
}

export async function setCustomerSession(cid: string, phone: string) {
  const token = sign({ cid, phone, exp: Date.now() + MAX_AGE * 1000 });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearCustomerSession() {
  (await cookies()).set(COOKIE, '', { path: '/', maxAge: 0 });
}

export async function getCustomerId(): Promise<string | null> {
  const c = (await cookies()).get(COOKIE)?.value;
  if (!c) return null;
  return verify(c)?.cid ?? null;
}
