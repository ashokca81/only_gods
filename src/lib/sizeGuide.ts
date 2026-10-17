// Dashboard-managed DEFAULT size-guide image (used when a product has none).
// Safe to import from client and server.

export interface SizeGuideConfig {
  image: string; // image URL; empty = no size guide
}

export const DEFAULT_SIZE_GUIDE: SizeGuideConfig = { image: '' };

export function mergeSizeGuide(value: unknown): SizeGuideConfig {
  const v = (value ?? {}) as Partial<SizeGuideConfig>;
  return { image: typeof v.image === 'string' ? v.image : DEFAULT_SIZE_GUIDE.image };
}
