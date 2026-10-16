'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_MOBILE_GRID, mergeMobileGrid } from '@/lib/mobileGrid';

let cache: Promise<string[]> | null = null;

/** Admin-picked product ids for the mobile 2x2 grid above the carousel. */
export function useMobileGrid(): string[] {
  const [ids, setIds] = useState<string[]>(DEFAULT_MOBILE_GRID.ids);
  useEffect(() => {
    if (!cache) {
      cache = fetch('/api/settings/mobile-grid')
        .then((r) => r.json())
        .then((j) => mergeMobileGrid(j.mobileGrid).ids)
        .catch(() => DEFAULT_MOBILE_GRID.ids);
    }
    let alive = true;
    cache.then((v) => { if (alive) setIds(v); });
    return () => { alive = false; };
  }, []);
  return ids;
}
