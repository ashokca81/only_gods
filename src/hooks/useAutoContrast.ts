'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

// Decide whether the background directly behind a fixed bar is light or dark,
// so its icons can flip colour. Pure DOM sampling — no canvas, so no CORS.
// Sections that are image/video dominated can force a result with data-nav="dark".
function sampleTheme(position: 'top' | 'bottom'): Theme {
  if (typeof window === 'undefined') return 'light';
  const w = window.innerWidth;
  const y = position === 'top' ? 46 : window.innerHeight - 56;
  const xs = [w * 0.12, w * 0.5, w * 0.88];
  let dark = 0;
  let light = 0;

  for (const x of xs) {
    const els = document.elementsFromPoint(x, y) as HTMLElement[];
    for (const el of els) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.closest('[data-nav-ignore]')) continue; // the bar itself
      const tagged = (el.closest('[data-nav]') as HTMLElement | null)?.dataset.nav;
      if (tagged === 'dark') { dark++; break; }
      if (tagged === 'light') { light++; break; }
      if (el.tagName === 'IMG' || el.tagName === 'VIDEO') continue; // see through to a bg
      const bg = getComputedStyle(el).backgroundColor;
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const p = m[1].split(',').map(Number);
        const a = p[3] ?? 1;
        if (a > 0.4) {
          const lum = 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
          if (lum < 128) dark++; else light++;
          break;
        }
      }
    }
  }
  return dark > light ? 'dark' : 'light';
}

export function useAutoContrast(position: 'top' | 'bottom'): Theme {
  const [theme, setTheme] = useState<Theme>('dark');
  const pathname = usePathname();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setTheme(sampleTheme(position));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };

    // Let the page paint first, then read.
    const t = setTimeout(update, 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [position, pathname]);

  return theme;
}
