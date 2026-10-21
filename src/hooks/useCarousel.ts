'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_CAROUSEL, mergeCarousel, mergeCarouselFlags, type CarouselSlide } from '@/lib/carousel';

interface CarouselData { slides: CarouselSlide[]; desktopEnabled: boolean }
let cache: Promise<CarouselData> | null = null;

/** Home carousel slides + desktop-visibility flag, fetched once and shared. */
export function useCarousel(): CarouselData {
  const [data, setData] = useState<CarouselData>({ slides: DEFAULT_CAROUSEL, desktopEnabled: true });
  useEffect(() => {
    if (!cache) {
      cache = fetch('/api/settings/carousel')
        .then((r) => r.json())
        .then((j) => ({ slides: mergeCarousel(j.slides), desktopEnabled: mergeCarouselFlags(j).desktopEnabled }))
        .catch(() => ({ slides: DEFAULT_CAROUSEL, desktopEnabled: true }));
    }
    let alive = true;
    cache.then((v) => { if (alive) setData(v); });
    return () => { alive = false; };
  }, []);
  return data;
}
