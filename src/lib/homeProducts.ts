// Which products appear in the home product-grid section (admin-picked).
// Empty ⇒ show all products. Unlimited. Safe to import from client and server.

export interface HomeProducts {
  ids: string[];
}

export const DEFAULT_HOME_PRODUCTS: HomeProducts = { ids: [] };

export function mergeHomeProducts(value: unknown): HomeProducts {
  const o = (value ?? {}) as Partial<HomeProducts>;
  const ids = Array.isArray(o.ids)
    ? o.ids.filter((id): id is string => typeof id === 'string' && id.trim() !== '').map((id) => id.trim())
    : [];
  // De-dupe, preserve order (no cap).
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return { ids: out };
}
