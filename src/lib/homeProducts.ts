// Which products appear in the home product-grid section (admin-picked).
// Empty ⇒ show all products. Unlimited. Each picked product can be hidden on
// Desktop and/or Mobile (default: shown on both). Safe for client and server.

export interface HomeProducts {
  ids: string[];
  hideDesktop: string[]; // picked ids NOT shown on desktop
  hideMobile: string[];  // picked ids NOT shown on mobile
}

export const DEFAULT_HOME_PRODUCTS: HomeProducts = { ids: [], hideDesktop: [], hideMobile: [] };

const cleanIds = (v: unknown): string[] => {
  const ids = Array.isArray(v)
    ? v.filter((id): id is string => typeof id === 'string' && id.trim() !== '').map((id) => id.trim())
    : [];
  return Array.from(new Set(ids)); // de-dupe, preserve order
};

export function mergeHomeProducts(value: unknown): HomeProducts {
  const o = (value ?? {}) as Partial<HomeProducts>;
  const ids = cleanIds(o.ids);
  const picked = new Set(ids);
  return {
    ids,
    hideDesktop: cleanIds(o.hideDesktop).filter((id) => picked.has(id)),
    hideMobile: cleanIds(o.hideMobile).filter((id) => picked.has(id)),
  };
}
