import type { Metadata } from 'next';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await getServerSupabase();
  if (!supabase) return {};

  const { data } = await supabase
    .from('products')
    .select('name, description, image, images')
    .eq('id', id)
    .single();

  const p = data as { name?: string; description?: string; image?: string; images?: string[] } | null;
  if (!p?.name) return {};

  const img = (p.images && p.images[0]) || p.image;
  const title = `${p.name} — ONLY GODS`;
  const desc = (p.description ?? '').trim() || `Shop ${p.name} at ONLY GODS — premium, limited-edition pieces.`;

  return {
    title,
    description: desc,
    openGraph: {
      type: 'website',
      siteName: 'ONLY GODS',
      title,
      description: desc,
      url: `/product/${id}`,
      images: img ? [{ url: img, width: 1200, height: 1200, alt: p.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: img ? [img] : undefined,
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
