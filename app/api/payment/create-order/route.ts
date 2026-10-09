import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { getCustomerId } from '@/lib/customer-session';
import { getRazorpay, isRazorpayConfigured, razorpayKeyId } from '@/lib/razorpay';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!isRazorpayConfigured) {
    return NextResponse.json({ error: 'Online payment is not set up yet. Please use Cash on Delivery.' }, { status: 503 });
  }
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Please log in to pay' }, { status: 401 });

  const { items, coupon } = await req.json().catch(() => ({}));
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'Store not configured' }, { status: 500 });

  const { data: cust } = await supabase.from('customers').select('phone').eq('id', cid).single();

  // Authoritative price from the DB (same logic as place_order).
  const { data: quote, error } = await supabase.rpc('quote_order', {
    items: Array.isArray(items) ? items : [],
    p_phone: cust?.phone ?? null,
    p_coupon: coupon || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const q = quote as { error?: string; total?: number };
  if (q?.error || !q?.total) return NextResponse.json({ error: 'Your cart is empty or invalid' }, { status: 400 });

  try {
    const order = await getRazorpay().orders.create({
      amount: Math.round(q.total * 100), // paise
      currency: 'INR',
      receipt: `og_${Date.now()}`,
    });
    return NextResponse.json({ razorpayOrderId: order.id, amount: order.amount, keyId: razorpayKeyId, quote: q });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not start payment' }, { status: 500 });
  }
}
