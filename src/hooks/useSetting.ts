'use client';

import { useLayoutEffect, useState } from 'react';

// Dashboard setting fetched once per page-load and remembered in localStorage, so
// the next visit / client navigation paints the admin's real content instantly.
// Returns null until real data is known — callers render nothing instead of
// built-in default text.
const memory = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();
const LS = 'og_setting:';

export function useSetting<T>(url: string, pick: (json: unknown) => T): T | null {
  const [data, setData] = useState<T | null>(() => (memory.has(url) ? (memory.get(url) as T) : null));

  // useLayoutEffect: on client navigation this runs before paint, so cached
  // content shows in the very first frame (no black / default flash).
  useLayoutEffect(() => {
    let alive = true;
    if (!memory.has(url)) {
      try {
        const raw = localStorage.getItem(LS + url);
        if (raw) { const v = JSON.parse(raw) as T; memory.set(url, v); setData(v); }
      } catch { /* ignore */ }
    }
    if (!inflight.has(url)) {
      inflight.set(
        url,
        fetch(url)
          .then((r) => r.json())
          .then((j) => {
            const v = pick(j);
            memory.set(url, v);
            try { localStorage.setItem(LS + url, JSON.stringify(v)); } catch { /* ignore */ }
            return v;
          })
          .catch(() => (memory.has(url) ? memory.get(url) : null)),
      );
    }
    inflight.get(url)!.then((v) => { if (alive && v != null) setData(v as T); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return data;
}
