import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { getCustomerId } from '@/lib/customer-session';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { code, subtotal, phone } = await req.json().catch(() => ({}));
  if (!code) return NextResponse.json({ valid: false, reason: 'Enter a code' });

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ valid: false, reason: 'Store not configured' });

  // Prefer the logged-in customer's phone for per-customer limits.
  const cid = await getCustomerId();
  let p_phone: string | null = typeof phone === 'string' ? phone : null;
  if (cid) {
    const { data } = await supabase.from('customers').select('phone').eq('id', cid).single();
    if (data?.phone) p_phone = data.phone;
  }

  const { data, error } = await supabase.rpc('validate_coupon', {
    p_code: String(code),
    p_subtotal: Number(subtotal) || 0,
    p_phone: p_phone,
  });
  if (error) return NextResponse.json({ valid: false, reason: error.message });
  return NextResponse.json(data);
}
