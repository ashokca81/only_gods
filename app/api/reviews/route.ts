import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { getCustomerId } from '@/lib/customer-session';
import { callRpc } from '@/lib/customer-rpc';

export const runtime = 'nodejs';

/** Approved reviews for a product + average + count. */
export async function GET(req: Request) {
  const productId = new URL(req.url).searchParams.get('productId');
  if (!productId) return NextResponse.json({ reviews: [], average: 0, count: 0 });

  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ reviews: [], average: 0, count: 0 });

  const { data } = await supabase
    .from('reviews')
    .select('id, name, rating, title, body, created_at')
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  const reviews = data ?? [];
  const count = reviews.length;
  const average = count ? reviews.reduce((a, r) => a + (r.rating || 0), 0) / count : 0;
  return NextResponse.json({ reviews, average: Math.round(average * 10) / 10, count });
}

/** Submit a review (logged-in customer). Goes to pending for admin approval. */
export async function POST(req: Request) {
  const cid = await getCustomerId();
  if (!cid) return NextResponse.json({ error: 'Please log in to write a review' }, { status: 401 });

  const { productId, rating, title, body } = await req.json().catch(() => ({}));
  if (!productId) return NextResponse.json({ error: 'Missing product' }, { status: 400 });
  const r = Number(rating);
  if (!(r >= 1 && r <= 5)) return NextResponse.json({ error: 'Please pick a rating (1-5 stars)' }, { status: 400 });

  try {
    await callRpc('submit_review', {
      p_cid: cid,
      p_product: String(productId),
      p_rating: r,
      p_title: title ?? null,
      p_body: body ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not submit' }, { status: 400 });
  }
}
