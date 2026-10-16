'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_CAROUSEL, mergeCarousel, type CarouselSlide } from '@/lib/carousel';

let cache: Promise<CarouselSlide[]> | null = null;

/** Home carousel slides, fetched once and shared. */
export function useCarousel(): CarouselSlide[] {
  const [slides, setSlides] = useState<CarouselSlide[]>(DEFAULT_CAROUSEL);
  useEffect(() => {
    if (!cache) {
      cache = fetch('/api/settings/carousel')
        .then((r) => r.json())
        .then((j) => mergeCarousel(j.slides))
        .catch(() => DEFAULT_CAROUSEL);
    }
    let alive = true;
    cache.then((v) => { if (alive) setSlides(v); });
    return () => { alive = false; };
  }, []);
  return slides;
}
