// Storefront "Collections" = season-wise curated groups (e.g. "Winter Season",
// "New Models 2026"). A product belongs to a collection when it is tagged with
// the collection's name (products.collections) OR its category is one of the
// collection's categories. Safe to import from client and server.

export interface Collection {
  title: string;
  image: string;
  categories: string[]; // every product in these categories is included automatically
}

/** No built-in/dummy collections — only what the admin creates. */
export const DEFAULT_COLLECTIONS: Collection[] = [];

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
    const categories: string[] = [];
    for (const x of Array.isArray(o.categories) ? o.categories : []) {
      const n = typeof x === 'string' ? x.trim() : '';
      if (n && !categories.some((c) => c.toLowerCase() === n.toLowerCase())) categories.push(n);
    }
    list.push({ title, image: typeof o.image === 'string' ? o.image.trim() : '', categories });
  }
  return list;
}

/** Is this product in the collection (tagged by name, or via one of its categories)? */
export function inCollection(
  p: { collections?: string[] | null; category?: string | null },
  col: Pick<Collection, 'title' | 'categories'>,
): boolean {
  if ((p.collections ?? []).includes(col.title)) return true;
  const cat = (p.category ?? '').trim().toLowerCase();
  return !!cat && col.categories.some((c) => c.toLowerCase() === cat);
}

/** Live item count per collection title. */
export function collectionCounts(
  cols: Collection[],
  products: { collections?: string[] | null; category?: string | null }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const col of cols) counts[col.title] = products.filter((p) => inCollection(p, col)).length;
  return counts;
}
