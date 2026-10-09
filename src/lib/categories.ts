// Shared category model — dashboard-managed, drives both the Shop filters and the
// Collections page. Safe to import from client and server (no server-only deps).

export interface Category {
  name: string;
  image: string;
}

const img = (id: string) =>
  `https://images.unsplash.com/${id}?q=80&w=800&auto=format&fit=crop`;

/** Fallback categories so the storefront never shows an empty filter bar. */
export const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Hoodies', image: img('photo-1556821840-3a63f95609a7') },
  { name: 'Zippers', image: img('photo-1503342217505-b0a15ec3261c') },
  { name: 'Studded', image: img('photo-1521572163474-6864f9cf17ab') },
  { name: 'Wildloom', image: img('photo-1506634572416-48cdfe530110') },
];

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
