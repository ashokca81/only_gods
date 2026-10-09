// Storefront "Collections" = season-wise curated groups (e.g. "Winter Season",
// "New Models 2026"). Completely independent of product Categories. A product is
// tagged with collection names; clicking a collection shows those products.
// Safe to import from client and server.

export interface Collection {
  title: string;
  image: string;
}

const img = (id: string) =>
  `https://images.unsplash.com/${id}?q=80&w=800&auto=format&fit=crop`;

/** Fallback cards so the Collections page is never empty. */
export const DEFAULT_COLLECTIONS: Collection[] = [
  { title: 'Winter Season', image: img('photo-1511556820780-d912e42b4980') },
  { title: 'New Models 2026', image: img('photo-1483985988355-763728e1935b') },
];

/** Normalise a stored settings value into a clean Collection[]. */
export function mergeCollections(value: unknown): Collection[] {
  if (!Array.isArray(value)) return DEFAULT_COLLECTIONS;
  const seen = new Set<string>();
  const list: Collection[] = [];
  for (const c of value) {
    const o = (c ?? {}) as Partial<Collection>;
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    if (!title || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    list.push({ title, image: typeof o.image === 'string' ? o.image.trim() : '' });
  }
  return list.length ? list : DEFAULT_COLLECTIONS;
}
