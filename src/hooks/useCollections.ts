'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_COLLECTIONS, mergeCollections, type Collection } from '@/lib/collections';

let cache: Promise<Collection[]> | null = null;

/** Storefront Collections, fetched once and shared across components. */
export function useCollections(): Collection[] {
  const [cols, setCols] = useState<Collection[]>(DEFAULT_COLLECTIONS);
  useEffect(() => {
    if (!cache) {
      cache = fetch('/api/settings/collections')
        .then((r) => r.json())
        .then((j) => mergeCollections(j.collections))
        .catch(() => DEFAULT_COLLECTIONS);
    }
    let alive = true;
    cache.then((v) => { if (alive) setCols(v); });
    return () => { alive = false; };
  }, []);
  return cols;
}
