'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_HOME_PRODUCTS, mergeHomeProducts } from '@/lib/homeProducts';

let cache: Promise<string[]> | null = null;

/** Admin-picked product ids for the home grid (empty ⇒ show all). */
export function useHomeProducts(): string[] {
  const [ids, setIds] = useState<string[]>(DEFAULT_HOME_PRODUCTS.ids);
  useEffect(() => {
    if (!cache) {
      cache = fetch('/api/settings/home-products')
        .then((r) => r.json())
        .then((j) => mergeHomeProducts(j.homeProducts).ids)
        .catch(() => DEFAULT_HOME_PRODUCTS.ids);
    }
    let alive = true;
    cache.then((v) => { if (alive) setIds(v); });
    return () => { alive = false; };
  }, []);
  return ids;
}
