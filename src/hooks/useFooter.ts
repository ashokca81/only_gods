'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_FOOTER, mergeFooter, type FooterConfig } from '@/lib/footer';

let cache: Promise<FooterConfig> | null = null;

/** Footer content, fetched once and shared across components. */
export function useFooter(): FooterConfig {
  const [f, setF] = useState<FooterConfig>(DEFAULT_FOOTER);
  useEffect(() => {
    if (!cache) {
      cache = fetch('/api/settings/footer')
        .then((r) => r.json())
        .then((j) => mergeFooter(j.footer))
        .catch(() => DEFAULT_FOOTER);
    }
    let alive = true;
    cache.then((v) => { if (alive) setF(v); });
    return () => { alive = false; };
  }, []);
  return f;
}
