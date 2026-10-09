import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';
import { verifyRazorpaySignature } from '@/lib/razorpay';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Please log in' }, { status: 401 });

  const {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    customer, items, coupon,
  } = await req.json().catch(() => ({}));

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
  }
  if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'Store not configured' }, { status: 500 });

  // Payment is verified — now create the order (prepaid).
  const { data, error } = await supabase.rpc('place_order', {
    customer, items, payment: 'prepaid', p_customer_id: cid, p_coupon: coupon || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const result = data as { order_no?: string; total?: number };
  if (result?.order_no) {
    await supabase
      .from('orders')
      .update({ razorpay_order_id, razorpay_payment_id, payment_status: 'paid' })
      .eq('order_no', result.order_no);
  }

  // Clear the saved cart snapshot.
  try { await callRpc('cart_clear', { p_cid: cid }); } catch { /* non-critical */ }

  return NextResponse.json(data);
}
