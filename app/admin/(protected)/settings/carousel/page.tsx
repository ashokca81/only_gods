import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getServerSupabase } from '@/lib/supabase/server';
import { mergeCarousel } from '@/lib/carousel';
import { mergeCategories } from '@/lib/categories';
import CarouselForm from '../CarouselForm';

export const dynamic = 'force-dynamic';

export default async function CarouselSettingsPage() {
  const supabase = await getServerSupabase();
  const [{ data: carouselRow }, { data: categoriesRow }] = await Promise.all([
    supabase!.from('settings').select('value').eq('key', 'home_carousel').single(),
    supabase!.from('settings').select('value').eq('key', 'categories').single(),
  ]);
  return (
    <div>
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft size={15} /> Settings
      </Link>
      <CarouselForm initial={mergeCarousel(carouselRow?.value)} allCategories={mergeCategories(categoriesRow?.value)} />
    </div>
  );
}
