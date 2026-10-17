'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Remember the URL + time of the last browser back/forward (popstate). We match
// on URL and use a generous window so a dev recompile delay or React Strict
// Mode's double-mount still counts the navigation as a "back".
let lastPopAt = 0;
let lastPopUrl = '';
let bound = false;
function bind() {
  if (bound || typeof window === 'undefined') return;
  bound = true;
  window.addEventListener('popstate', () => {
    lastPopAt = Date.now();
    lastPopUrl = window.location.pathname + window.location.search;
  });
}

const urlNow = () => window.location.pathname + window.location.search;
const keyFor = () => `scroll:${urlNow()}`;

/**
 * Remembers the scroll position per URL and restores it on back/forward,
 * after async list content has rendered. Forward navigations start at the top.
 * Call once near the top of a list page (home, shop, cart, wishlist, …).
 */
export function useScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    bind();
    const wasPop = lastPopUrl === urlNow() && Date.now() - lastPopAt < 10000;

    // Freeze saving briefly on every mount so the framework's scroll-to-top (and
    // Strict Mode's throwaway mount in dev) can't clobber the saved value.
    let freeze = true;
    let frame = 0;
    let attemptTimer: ReturnType<typeof setTimeout> | 0 = 0;
    const write = (y: number) => { try { sessionStorage.setItem(keyFor(), String(y)); } catch {} };
    const save = () => { frame = 0; if (!freeze) write(window.scrollY); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(save); };
    // Save the exact position the moment a navigation starts (before scroll-to-top).
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      const href = a?.getAttribute('href');
      if (href && !href.startsWith('#')) { write(window.scrollY); freeze = true; }
    };
    const onHide = () => { if (!freeze) write(window.scrollY); };
    const unfreeze = () => { freeze = false; }; // the user taking over ends any freeze

    if (wasPop) {
      // Restore the saved position, re-applying until the (async) content is tall
      // enough to reach it — or the user scrolls, or 10s passes.
      let y = NaN;
      try { y = parseInt(sessionStorage.getItem(keyFor()) || '', 10); } catch {}
      if (Number.isFinite(y) && y > 0) {
        const start = performance.now();
        const attempt = () => {
          window.scrollTo(0, y);
          const reached = Math.abs(window.scrollY - y) <= 2;
          if (!reached && freeze && performance.now() - start < 10000) {
            attemptTimer = setTimeout(attempt, 50);
          } else {
            freeze = false;
          }
        };
        attempt();
      } else {
        setTimeout(unfreeze, 600);
      }
    } else {
      // Forward / fresh visit: just lift the short grace freeze.
      setTimeout(unfreeze, 600);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick, true);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('wheel', unfreeze, { passive: true });
    window.addEventListener('touchstart', unfreeze, { passive: true });
    window.addEventListener('keydown', unfreeze);

    return () => {
      if (!freeze) write(window.scrollY);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('wheel', unfreeze);
      window.removeEventListener('touchstart', unfreeze);
      window.removeEventListener('keydown', unfreeze);
      if (frame) cancelAnimationFrame(frame);
      if (attemptTimer) clearTimeout(attemptTimer);
    };
  }, [pathname]);
}
