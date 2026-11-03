'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_HOME_PRODUCTS, mergeHomeProducts, type HomeProducts } from '@/lib/homeProducts';

let cache: Promise<HomeProducts> | null = null;

/** Admin-picked home grid products (empty ids ⇒ show all) + per-device hiding. */
export function useHomeProducts(): HomeProducts {
  const [cfg, setCfg] = useState<HomeProducts>(DEFAULT_HOME_PRODUCTS);
  useEffect(() => {
    if (!cache) {
      cache = fetch('/api/settings/home-products')
        .then((r) => r.json())
        .then((j) => mergeHomeProducts(j.homeProducts))
        .catch(() => DEFAULT_HOME_PRODUCTS);
    }
    let alive = true;
    cache.then((v) => { if (alive) setCfg(v); });
    return () => { alive = false; };
  }, []);
  return cfg;
}
