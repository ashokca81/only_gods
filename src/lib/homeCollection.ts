// Home "The Collection" sticky-split section — dashboard-managed.
// Left = one sticky image; right = the selected Collections shown as cards.
// Safe to import from client and server (no server-only deps).

export interface HomeCollection {
  /** Left-side sticky image URL. */
  stickyImage: string;
  /** Titles of the Collections to show as cards on the right (in order). */
  titles: string[];
}

export const DEFAULT_HOME_COLLECTION: HomeCollection = {
  stickyImage: '/runway-left.png',
  titles: [],
};

/** Normalise a stored settings value into a clean HomeCollection. */
export function mergeHomeCollection(value: unknown): HomeCollection {
  const o = (value ?? {}) as Partial<HomeCollection>;
  const stickyImage =
    typeof o.stickyImage === 'string' && o.stickyImage.trim() !== ''
      ? o.stickyImage.trim()
      : DEFAULT_HOME_COLLECTION.stickyImage;
  const titles = Array.isArray(o.titles)
    ? o.titles.filter((t): t is string => typeof t === 'string' && t.trim() !== '').map((t) => t.trim())
    : [];
  return { stickyImage, titles };
}
