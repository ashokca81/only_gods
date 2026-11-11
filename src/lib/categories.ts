// Shared category model — dashboard-managed, drives both the Shop filters and the
// Collections page. Safe to import from client and server (no server-only deps).

export interface Category {
  name: string;
  image: string;
}

export const DEFAULT_CATEGORIES: Category[] = []; // no demo categories — only the admin's

/** Normalise a stored settings value into a clean Category[]. */
export function mergeCategories(value: unknown): Category[] {
  if (!Array.isArray(value)) return DEFAULT_CATEGORIES;
  const seen = new Set<string>();
  const cats: Category[] = [];
  for (const c of value) {
    const o = (c ?? {}) as Partial<Category>;
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    cats.push({ name, image: typeof o.image === 'string' ? o.image.trim() : '' });
  }
  return cats.length ? cats : DEFAULT_CATEGORIES;
}
