// Admin-picked products shown in a 2-column grid above the carousel on MOBILE only.
// Max 4 (2 rows x 2 columns). Safe to import from client and server.

export interface MobileGrid {
  ids: string[];
}

export const DEFAULT_MOBILE_GRID: MobileGrid = { ids: [] };
export const MOBILE_GRID_MAX = 4;

export function mergeMobileGrid(value: unknown): MobileGrid {
  const o = (value ?? {}) as Partial<MobileGrid>;
  const ids = Array.isArray(o.ids)
    ? o.ids.filter((id): id is string => typeof id === 'string' && id.trim() !== '').map((id) => id.trim())
    : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MOBILE_GRID_MAX) break;
  }
  return { ids: out };
}
