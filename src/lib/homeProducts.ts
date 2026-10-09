// Which products appear in the home product-grid section (admin-picked).
// Empty ⇒ show all products. Max 8. Safe to import from client and server.

export interface HomeProducts {
  ids: string[];
}

export const DEFAULT_HOME_PRODUCTS: HomeProducts = { ids: [] };
export const HOME_PRODUCTS_MAX = 8;

export function mergeHomeProducts(value: unknown): HomeProducts {
  const o = (value ?? {}) as Partial<HomeProducts>;
  const ids = Array.isArray(o.ids)
    ? o.ids.filter((id): id is string => typeof id === 'string' && id.trim() !== '').map((id) => id.trim())
    : [];
  // De-dupe, preserve order, cap at the max.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= HOME_PRODUCTS_MAX) break;
  }
  return { ids: out };
}
