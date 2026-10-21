'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_FEATURED, mergeFeatured, type FeaturedGrid } from '@/lib/featured';

let cache: Promise<FeaturedGrid> | null = null;

/** Admin-picked products + per-device flags for the "What's Hot" magazine grid. */
export function useFeatured(): FeaturedGrid {
  const [data, setData] = useState<FeaturedGrid>(DEFAULT_FEATURED);
  useEffect(() => {
    if (!cache) {
      cache = fetch('/api/settings/featured')
        .then((r) => r.json())
        .then((j) => mergeFeatured(j.featured))
        .catch(() => DEFAULT_FEATURED);
    }
    let alive = true;
    cache.then((v) => { if (alive) setData(v); });
    return () => { alive = false; };
  }, []);
  return data;
}
