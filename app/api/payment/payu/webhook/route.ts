import { NextResponse } from 'next/server';
import { finalizePayu, readPayuBody } from '@/lib/payu';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PayU server-to-server webhook (payment success/failure). Backup for when the
 * customer closes the browser before returning. Idempotent with /return.
 */
export async function POST(req: Request) {
  const fields = await readPayuBody(req);
  const result = await finalizePayu(fields);
  // Always 200 for a verified callback so PayU stops retrying; 400 only for bad signatures.
  if (!result.ok && result.reason === 'invalid') {
    return NextResponse.json({ ok: false, error: result.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, ...(result.ok ? { order_no: result.orderNo } : { state: result.reason }) });
}
