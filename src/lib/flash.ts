// Store-wide flash sale config (settings key='flash_sale'). Client + server safe.

export interface FlashSale {
  enabled: boolean;
  title: string;
  percent: number;
  start: string | null;
  end: string | null;
  bg: string;
  fg: string;
}

export const DEFAULT_FLASH: FlashSale = {
  enabled: false,
  title: 'Flash Sale',
  percent: 0,
  start: null,
  end: null,
  bg: '#dc2626',
  fg: '#ffffff',
};

export function mergeFlash(value: unknown): FlashSale {
  const v = (value ?? {}) as Partial<FlashSale>;
  const pick = (s: unknown, fb: string) => (typeof s === 'string' && s.trim() !== '' ? s : fb);
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : DEFAULT_FLASH.enabled,
    title: typeof v.title === 'string' ? v.title : DEFAULT_FLASH.title,
    percent: typeof v.percent === 'number' && v.percent >= 0 ? v.percent : DEFAULT_FLASH.percent,
    start: typeof v.start === 'string' ? v.start : null,
    end: typeof v.end === 'string' ? v.end : null,
    bg: pick(v.bg, DEFAULT_FLASH.bg),
    fg: pick(v.fg, DEFAULT_FLASH.fg),
  };
}

/** Is the flash sale live right now? */
export function isFlashActive(f: FlashSale, now: number = Date.now()): boolean {
  if (!f.enabled || f.percent <= 0) return false;
  if (f.start && now < Date.parse(f.start)) return false;
  if (f.end && now > Date.parse(f.end)) return false;
  return true;
}

/** Sale price for a base price under the current flash (rounded). */
export function flashPrice(price: number, f: FlashSale, now?: number): number {
  return isFlashActive(f, now) ? Math.round(price * (1 - f.percent / 100)) : price;
}
