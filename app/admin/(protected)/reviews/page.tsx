import { getServerSupabase } from '@/lib/supabase/server';
import ReviewsManager, { type ReviewRow } from './ReviewsManager';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!
    .from('reviews')
    .select('id, product_id, name, rating, title, body, is_approved, created_at, products(name)')
    .order('created_at', { ascending: false });

  const rows: ReviewRow[] = (data ?? []).map((raw) => {
    const r = raw as unknown as {
      id: string; product_id: string; name: string; rating: number;
      title: string | null; body: string | null; is_approved: boolean; created_at: string;
      products: { name: string } | { name: string }[] | null;
    };
    const prod = Array.isArray(r.products) ? r.products[0] : r.products;
    return {
      id: r.id,
      product_id: r.product_id,
      product_name: prod?.name ?? '—',
      name: r.name,
      rating: r.rating,
      title: r.title,
      body: r.body,
      is_approved: r.is_approved,
      created_at: r.created_at,
    };
  });

  return <ReviewsManager initialReviews={rows} />;
}
