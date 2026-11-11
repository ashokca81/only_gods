// Home "collection" carousel (replaces the old sticky-split section).
// Each slide: a desktop image, a mobile image, a title, and a category to link to.
// Dashboard-managed. Safe to import from client and server.

export interface CarouselSlide {
  desktopImage: string;
  mobileImage: string;
  title: string;
  category: string; // category name -> links to /shop?category=<name>
}

/** No demo slides — the carousel stays hidden until the admin adds slides. */
export const DEFAULT_CAROUSEL: CarouselSlide[] = [];

/** Build the storefront link for a slide. */
export function slideHref(s: CarouselSlide): string {
  return s.category ? `/shop?category=${encodeURIComponent(s.category)}` : '/shop';
}

/** Desktop visibility flag for the carousel (mobile is always shown). */
export interface CarouselFlags {
  desktopEnabled: boolean;
}
export const DEFAULT_CAROUSEL_FLAGS: CarouselFlags = { desktopEnabled: true };
export function mergeCarouselFlags(value: unknown): CarouselFlags {
  const v = (value ?? {}) as Partial<CarouselFlags>;
  return { desktopEnabled: v.desktopEnabled !== false }; // default ON
}

export function mergeCarousel(value: unknown): CarouselSlide[] {
  if (!Array.isArray(value)) return DEFAULT_CAROUSEL;
  const list: CarouselSlide[] = [];
  for (const s of value) {
    const o = (s ?? {}) as Partial<CarouselSlide>;
    const desktopImage = typeof o.desktopImage === 'string' ? o.desktopImage.trim() : '';
    const mobileImage = typeof o.mobileImage === 'string' ? o.mobileImage.trim() : '';
    if (!desktopImage && !mobileImage) continue; // skip empty slides
    list.push({
      desktopImage: desktopImage || mobileImage,
      mobileImage: mobileImage || desktopImage,
      title: typeof o.title === 'string' ? o.title.trim() : '',
      category: typeof o.category === 'string' ? o.category.trim() : '',
    });
  }
  return list.length ? list : DEFAULT_CAROUSEL;
}
