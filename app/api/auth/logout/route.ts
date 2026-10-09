import { NextResponse } from 'next/server';
import { clearCustomerSession } from '@/lib/customer-session';

export const runtime = 'nodejs';

export async function POST() {
  await clearCustomerSession();
  return NextResponse.json({ ok: true });
}
