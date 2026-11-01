import crypto from 'crypto';
import { getServerSupabase } from '@/lib/supabase/server';
import { callRpc } from '@/lib/customer-rpc';

// PayU India — hosted checkout. Keys come only from env (never from code).
//   PAYU_MERCHANT_KEY, PAYU_MERCHANT_SALT, PAYU_MODE = 'live' | 'test'
const KEY = process.env.PAYU_MERCHANT_KEY || '';
const SALT = process.env.PAYU_MERCHANT_SALT || '';
const MODE = (process.env.PAYU_MODE || 'live').toLowerCase() === 'test' ? 'test' : 'live';

export const isPayuConfigured = Boolean(KEY && SALT);
export const payuKey = KEY;
export const payuActionUrl = MODE === 'test' ? 'https://test.payu.in/_payment' : 'https://secure.payu.in/_payment';
const VERIFY_URL = MODE === 'test'
  ? 'https://test.payu.in/merchant/postservice.php?form=2'
  : 'https://info.payu.in/merchant/postservice.php?form=2';

const sha512 = (s: string) => crypto.createHash('sha512').update(s).digest('hex');

export interface PayuRequest {
  txnid: string;
  amount: string;      // always 2 decimals, identical in form + hash
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string; udf2?: string; udf3?: string; udf4?: string; udf5?: string;
}

/** Request hash: sha512(key|txnid|amount|productinfo|firstname|email|udf1..udf5||||||SALT) */
export function requestHash(r: PayuRequest): string {
  return sha512([
    KEY, r.txnid, r.amount, r.productinfo, r.firstname, r.email,
    r.udf1 ?? '', r.udf2 ?? '', r.udf3 ?? '', r.udf4 ?? '', r.udf5 ?? '',
    '', '', '', '', '', SALT,
  ].join('|'));
}

/** Response hash: sha512([additionalCharges|]SALT|status||||||udf5..udf1|email|firstname|productinfo|amount|txnid|key) */
export function verifyResponseHash(f: Record<string, string>): boolean {
  if (!SALT || !f.hash) return false;
  const parts = [
    SALT, f.status ?? '', '', '', '', '', '',
    f.udf5 ?? '', f.udf4 ?? '', f.udf3 ?? '', f.udf2 ?? '', f.udf1 ?? '',
    f.email ?? '', f.firstname ?? '', f.productinfo ?? '', f.amount ?? '', f.txnid ?? '', f.key ?? '',
  ];
  let base = parts.join('|');
  if (f.additionalCharges) base = `${f.additionalCharges}|${base}`;
  const expected = sha512(base);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(f.hash).toLowerCase()));
  } catch {
    return false;
  }
}

/** Server-to-server confirmation. 'success' | 'not_success' | 'unknown' (network/parse error). */
async function verifyWithPayu(txnid: string): Promise<'success' | 'not_success' | 'unknown'> {
  try {
    const command = 'verify_payment';
    const body = new URLSearchParams({ key: KEY, command, var1: txnid, hash: sha512(`${KEY}|${command}|${txnid}|${SALT}`) });
    const r = await fetch(VERIFY_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store',
    });
    const j = await r.json();
    const tx = j?.transaction_details?.[txnid];
    if (!tx) return 'unknown';
    return String(tx.status).toLowerCase() === 'success' ? 'success' : 'not_success';
  } catch {
    return 'unknown';
  }
}

export type FinalizeResult =
  | { ok: true; orderNo: string; total: number }
  | { ok: false; reason: 'failed' | 'invalid' | 'paid_no_order' | 'pending'; message: string };

/**
 * Turn a PayU callback (return URL or webhook) into an order. Safe to call
 * twice — only the first caller that claims the payment creates the order.
 */
export async function finalizePayu(f: Record<string, string>): Promise<FinalizeResult> {
  const txnid = f.txnid ?? '';
  if (!txnid || !verifyResponseHash(f) || f.key !== KEY) {
    return { ok: false, reason: 'invalid', message: 'Payment response could not be verified.' };
  }

  const status = String(f.status ?? '').toLowerCase();
  if (status !== 'success') {
    try { await callRpc('payu_fail', { p_txnid: txnid, p_note: `${status}: ${f.error_Message ?? f.field9 ?? ''}`.slice(0, 300) }); } catch { /* ignore */ }
    return { ok: false, reason: 'failed', message: 'Payment was not completed.' };
  }

  // Already finalized (e.g. the webhook got here first)?
  const existing = await callRpc<{ status: string; order_no: string | null; amount: number } | null>('payu_get', { p_txnid: txnid });
  if (!existing) return { ok: false, reason: 'invalid', message: 'Unknown payment.' };
  if (existing.status === 'paid' && existing.order_no) {
    return { ok: true, orderNo: existing.order_no, total: Number(existing.amount) };
  }

  // Amount must match what we asked PayU to collect.
  if (Number(f.amount) !== Number(existing.amount)) {
    return { ok: false, reason: 'invalid', message: 'Paid amount does not match the order.' };
  }

  // Double-check with PayU directly (only an explicit "not success" blocks).
  if ((await verifyWithPayu(txnid)) === 'not_success') {
    return { ok: false, reason: 'failed', message: 'Payment was not confirmed by PayU.' };
  }

  const claim = await callRpc<{ customer_id: string; payload: { customer: unknown; items: unknown; coupon: string | null }; amount: number } | null>(
    'payu_claim', { p_txnid: txnid },
  );
  if (!claim) {
    // Someone else is finishing it right now — report the current state.
    const now = await callRpc<{ status: string; order_no: string | null; amount: number } | null>('payu_get', { p_txnid: txnid });
    if (now?.order_no) return { ok: true, orderNo: now.order_no, total: Number(now.amount) };
    return { ok: false, reason: 'pending', message: 'Your payment is being confirmed. Please check My Orders in a minute.' };
  }

  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, reason: 'pending', message: 'Store not configured.' };

  const { data, error } = await supabase.rpc('place_order', {
    customer: claim.payload.customer,
    items: claim.payload.items,
    payment: 'prepaid',
    p_customer_id: claim.customer_id,
    p_coupon: claim.payload.coupon || null,
  });
  const orderNo = (data as { order_no?: string } | null)?.order_no;

  if (error || !orderNo) {
    // Money received but the order could not be created (e.g. stock ran out) — flag for a refund.
    await callRpc('payu_complete', {
      p_txnid: txnid, p_status: 'paid_no_order', p_order_no: null, p_mihpayid: f.mihpayid ?? null,
      p_note: (error?.message ?? 'place_order returned no order').slice(0, 300),
    });
    return { ok: false, reason: 'paid_no_order', message: 'We received your payment but could not create the order. Our team will contact you or refund it.' };
  }

  await callRpc('payu_complete', {
    p_txnid: txnid, p_status: 'paid', p_order_no: orderNo, p_mihpayid: f.mihpayid ?? null, p_note: null,
  });
  try { await callRpc('cart_clear', { p_cid: claim.customer_id }); } catch { /* non-critical */ }

  return { ok: true, orderNo, total: Number(claim.amount) };
}

/** Parse a PayU POST body (form-encoded or JSON) into a flat string map. */
export async function readPayuBody(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') || '';
  const out: Record<string, string> = {};
  if (ct.includes('application/json')) {
    const j = await req.json().catch(() => ({}));
    for (const [k, v] of Object.entries(j ?? {})) out[k] = v == null ? '' : String(v);
    return out;
  }
  const text = await req.text();
  for (const [k, v] of new URLSearchParams(text)) out[k] = v;
  return out;
}
