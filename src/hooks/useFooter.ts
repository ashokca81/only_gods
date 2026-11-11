'use client';

import { mergeFooter, type FooterConfig } from '@/lib/footer';
import { useSetting } from '@/hooks/useSetting';

/** Footer content from the dashboard (null until loaded — no built-in text). */
export function useFooter(): FooterConfig | null {
  return useSetting<FooterConfig>('/api/settings/footer', (j) => mergeFooter((j as { footer?: unknown })?.footer));
}
