// Home "collection" carousel (replaces the old sticky-split section).
// Each slide: a desktop image, a mobile image, a title, and a category to link to.
// Dashboard-managed. Safe to import from client and server.

export interface CarouselSlide {
  desktopImage: string;
  mobileImage: string;
  title: string;
  category: string; // category name -> links to /shop?category=<name>
}

const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

/** Fallback slides so the carousel is never empty before the admin sets it up. */
const defImg = (id: string, title: string, category: string): CarouselSlide => ({
  desktopImage: img(id), mobileImage: img(id, 800), title, category,
});
export const DEFAULT_CAROUSEL: CarouselSlide[] = [
  defImg('photo-1483985988355-763728e1935b', 'Hoodies', 'Hoodies'),
  defImg('photo-1521572163474-6864f9cf17ab', 'Studded', 'Studded'),
  defImg('photo-1503342217505-b0a15ec3261c', 'Zippers', 'Zippers'),
  defImg('photo-1556821840-3a63f95609a7', 'Wildloom', 'Wildloom'),
  defImg('photo-1511556820780-d912e42b4980', 'Hoodies', 'Hoodies'),
  defImg('photo-1539109136881-3be0616acf4b', 'Studded', 'Studded'),
  defImg('photo-1509631179647-0177331693ae', 'Zippers', 'Zippers'),
];

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
