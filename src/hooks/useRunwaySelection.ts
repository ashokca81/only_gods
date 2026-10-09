'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_RUNWAY_SELECTION, mergeRunwaySelection } from '@/lib/runwayCollections';

let cache: Promise<string[]> | null = null;

/** Titles of the Collections selected for the Runway (empty ⇒ show all). */
export function useRunwaySelection(): string[] {
  const [titles, setTitles] = useState<string[]>(DEFAULT_RUNWAY_SELECTION.titles);
  useEffect(() => {
    if (!cache) {
      cache = fetch('/api/settings/runway-collections')
        .then((r) => r.json())
        .then((j) => mergeRunwaySelection(j.runway).titles)
        .catch(() => DEFAULT_RUNWAY_SELECTION.titles);
    }
    let alive = true;
    cache.then((v) => { if (alive) setTitles(v); });
    return () => { alive = false; };
  }, []);
  return titles;
}
