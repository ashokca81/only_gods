'use client';

import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useMobileGrid } from '@/hooks/useMobileGrid';

/** Mobile-only 2-column grid (up to 4 products) shown above the carousel. */
export default function MobileProductGrid() {
  const { data: products } = useProducts();
  const ids = useMobileGrid();
  if (ids.length === 0) return null;

  const picked = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is (typeof products)[number] => !!p)
    .slice(0, 4);
  if (picked.length === 0) return null;

  return (
    <section className="lg:hidden px-4 pt-6 pb-2">
      <div className="grid grid-cols-2 gap-3">
        {picked.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} hideCarousel />
        ))}
      </div>
    </section>
  );
}
