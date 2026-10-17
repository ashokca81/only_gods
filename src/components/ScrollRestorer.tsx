'use client';

import { useScrollRestoration } from '@/hooks/useScrollRestoration';

/** Drop into a (server) page to remember & restore its scroll position. */
export default function ScrollRestorer() {
  useScrollRestoration();
  return null;
}
