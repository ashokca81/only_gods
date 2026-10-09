'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/format';
import { isSoldOut } from '@/lib/variants';
import { useFlash } from '@/hooks/useFlash';
import { isFlashActive, flashPrice } from '@/lib/flash';

/**
 * Lightweight "You may also like" row — picks in-stock products, biased to the
 * given categories, excluding ones already shown/in the cart. Drives AOV.
 */
export default function Upsell({
  title = 'You may also like',
  excludeIds = [],
  categories = [],
  limit = 4,
}: {
  title?: string;
  excludeIds?: string[];
  categories?: string[];
  limit?: number;
}) {
  const { data: products } = useProducts();
  const flash = useFlash();
  const flashOn = isFlashActive(flash);

  const picks = useMemo(() => {
    const exclude = new Set(excludeIds);
    const avail = products.filter((p) => !exclude.has(p.id) && !isSoldOut(p));
    const score = (p: typeof avail[number]) =>
      (categories.includes(p.category) ? 2 : 0) + (p.trending ? 1 : 0) + (p.newArrival ? 0.5 : 0);
    return [...avail].sort((a, b) => score(b) - score(a)).slice(0, limit);
  }, [products, excludeIds, categories, limit]);

  if (picks.length === 0) return null;

  return (
    <div className="mt-10">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {picks.map((p) => {
          const sale = flashPrice(p.price, flash);
          return (
            <Link key={p.id} href={`/product/${p.id}`} className="group rounded-[5px] border border-border overflow-hidden hover:border-foreground/30 transition-colors">
              <div className="aspect-[3/4] bg-secondary overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium truncate">{p.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-semibold">
                    {flashOn ? <span className="text-red-600">{formatPrice(sale)}</span> : formatPrice(p.price)}
                  </span>
                  <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={14} /></span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
