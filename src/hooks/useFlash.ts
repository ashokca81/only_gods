'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_FLASH, mergeFlash, type FlashSale } from '@/lib/flash';

let cache: Promise<FlashSale> | null = null;

/** Flash-sale config, fetched once and shared across all components. */
export function useFlash(): FlashSale {
  const [f, setF] = useState<FlashSale>(DEFAULT_FLASH);
  useEffect(() => {
    if (!cache) {
      cache = fetch('/api/settings/flash')
        .then((r) => r.json())
        .then((j) => mergeFlash(j.flash))
        .catch(() => DEFAULT_FLASH);
    }
    let alive = true;
    cache.then((v) => { if (alive) setF(v); });
    return () => { alive = false; };
  }, []);
  return f;
}
