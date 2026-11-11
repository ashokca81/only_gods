'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_COLLECTIONS, mergeCollections, type Collection } from '@/lib/collections';

let cache: Promise<Collection[]> | null = null;

/** Storefront Collections + whether they have loaded, fetched once and shared. */
export function useCollectionsState(): { collections: Collection[]; ready: boolean } {
  const [state, setState] = useState({ collections: DEFAULT_COLLECTIONS, ready: false });
  useEffect(() => {
    if (!cache) {
      cache = fetch('/api/settings/collections')
        .then((r) => r.json())
        .then((j) => mergeCollections(j.collections))
        .catch(() => DEFAULT_COLLECTIONS);
    }
    let alive = true;
    cache.then((v) => { if (alive) setState({ collections: v, ready: true }); });
    return () => { alive = false; };
  }, []);
  return state;
}

/** Storefront Collections, fetched once and shared across components. */
export function useCollections(): Collection[] {
  return useCollectionsState().collections;
}
