// Which Collections appear in the home Runway ("The Season") gallery.
// Empty list ⇒ show every collection. Safe to import from client and server.

export interface RunwaySelection {
  /** Titles of the Collections to show in the Runway (in order). */
  titles: string[];
}

export const DEFAULT_RUNWAY_SELECTION: RunwaySelection = { titles: [] };

export function mergeRunwaySelection(value: unknown): RunwaySelection {
  const o = (value ?? {}) as Partial<RunwaySelection>;
  const titles = Array.isArray(o.titles)
    ? o.titles.filter((t): t is string => typeof t === 'string' && t.trim() !== '').map((t) => t.trim())
    : [];
  return { titles };
}
