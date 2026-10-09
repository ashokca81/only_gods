import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Please log in to place your order' }, { status: 401 });

  const { customer, items, payment, coupon } = await req.json().catch(() => ({}));
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'Store not configured' }, { status: 500 });

  const { data, error } = await supabase.rpc('place_order', {
    customer,
    items,
    payment: payment || 'cod',
    p_customer_id: cid,
    p_coupon: coupon || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Order placed — clear the saved cart snapshot (no longer abandoned).
  try { await callRpc('cart_clear', { p_cid: cid }); } catch { /* non-critical */ }

  return NextResponse.json(data);
}
