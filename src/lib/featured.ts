// Admin-picked products for the "What's Hot" magazine grid (below the carousel).
// Max 5 (1 large + 4). Per-device show/hide flags. Safe on client and server.

export interface FeaturedGrid {
  ids: string[];
  desktopEnabled: boolean;
  mobileEnabled: boolean;
}

export const DEFAULT_FEATURED: FeaturedGrid = { ids: [], desktopEnabled: true, mobileEnabled: true };
export const FEATURED_MAX = 5;

export function mergeFeatured(value: unknown): FeaturedGrid {
  const o = (value ?? {}) as Partial<FeaturedGrid>;
  const ids = Array.isArray(o.ids)
    ? o.ids.filter((id): id is string => typeof id === 'string' && id.trim() !== '').map((id) => id.trim())
    : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= FEATURED_MAX) break;
  }
  return {
    ids: out,
    desktopEnabled: o.desktopEnabled !== false, // default ON
    mobileEnabled: o.mobileEnabled !== false,   // default ON
  };
}
