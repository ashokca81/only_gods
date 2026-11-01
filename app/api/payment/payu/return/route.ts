import { NextResponse } from 'next/server';
import { finalizePayu, readPayuBody } from '@/lib/payu';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PayU posts the customer's browser here after payment (surl + furl).
 * Verify, create the order, then send the customer to the right page.
 * 303 turns PayU's POST into a normal GET page load.
 */
export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const fields = await readPayuBody(req);
  const result = await finalizePayu(fields);

  if (result.ok) {
    return NextResponse.redirect(`${origin}/order/${encodeURIComponent(result.orderNo)}?total=${result.total}`, 303);
  }
  const reason = result.reason === 'failed' ? 'failed' : result.reason;
  return NextResponse.redirect(`${origin}/checkout?payment=${reason}`, 303);
}

// Someone opening the URL directly — just go back to checkout.
export async function GET(req: Request) {
  return NextResponse.redirect(`${new URL(req.url).origin}/checkout`, 303);
}
