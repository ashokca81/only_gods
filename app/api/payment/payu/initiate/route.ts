import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';
import { isPayuConfigured, payuActionUrl, payuKey, requestHash } from '@/lib/payu';

export const runtime = 'nodejs';

/**
 * Start a PayU payment. Saves the cart server-side (the customer leaves the
 * site), then returns the fields the browser must POST to PayU.
 * Body: { customer, items, coupon }
 */
export async function POST(req: Request) {
  if (!isPayuConfigured) {
    return NextResponse.json({ error: 'Online payment is not set up yet. Please use Cash on Delivery.' }, { status: 503 });
  }
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Please log in to pay' }, { status: 401 });

  const { customer, items, coupon } = await req.json().catch(() => ({}));
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'Store not configured' }, { status: 500 });

  const { data: cust } = await supabase.from('customers').select('phone, name').eq('id', cid).single();

  // Authoritative total from the DB (same pricing as place_order).
  const { data: quote, error } = await supabase.rpc('quote_order', {
    items, p_phone: cust?.phone ?? null, p_coupon: coupon || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const q = quote as { error?: string; total?: number };
  if (q?.error || !q?.total) return NextResponse.json({ error: q?.error || 'Your cart is empty or invalid' }, { status: 400 });

  const amount = Number(q.total).toFixed(2);
  const txnid = `OG${Date.now()}${crypto.randomBytes(3).toString('hex')}`.toUpperCase();

  const c = (customer ?? {}) as { name?: string; email?: string; phone?: string };
  const phone = String(c.phone || cust?.phone || '').replace(/\D/g, '').slice(-10);
  const firstname = (String(c.name || cust?.name || 'Customer').replace(/[^A-Za-z0-9 .]/g, '').trim() || 'Customer').slice(0, 60);
  const emailIn = String(c.email || '').trim();
  const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailIn) ? emailIn : 'orders@theonlygods.com';
  const productinfo = 'ONLY GODS Order';

  try {
    await callRpc('payu_create', {
      p_txnid: txnid, p_cid: cid, p_payload: { customer, items, coupon: coupon || null }, p_amount: Number(amount),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not start payment' }, { status: 500 });
  }

  const origin = new URL(req.url).origin;
  const returnUrl = `${origin}/api/payment/payu/return`;

  const fields: Record<string, string> = {
    key: payuKey,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    phone,
    surl: returnUrl,
    furl: returnUrl,
    udf1: cid,
  };
  fields.hash = requestHash({ txnid, amount, productinfo, firstname, email, udf1: cid });

  return NextResponse.json({ action: payuActionUrl, fields });
}
