import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Lightweight poll for the admin new-order notifier. Admin only. */
export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: latest } = await supabase
    .from('orders')
    .select('order_no, customer_name, total, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: pending } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return NextResponse.json({ latest: latest ?? null, pending: pending ?? 0 });
}
