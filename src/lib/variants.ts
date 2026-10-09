import type { Product } from '@/data/products';

export interface VariantSize {
  size: string;
  stock: number;
}

/** One colour variant: its own price, images and size/stock list. */
export interface Variant {
  color: string; // hex (e.g. "#1e40af") or css colour name (legacy "Black")
  name?: string; // optional human label
  price: number;
  original_price: number | null;
  images: string[];
  sizes: VariantSize[];
}

/** True when a DB product is known to be out of stock (flat stock tracked = 0). */
export function isSoldOut(p: Product): boolean {
  return typeof p.stock === 'number' && p.stock <= 0;
}

/** Variants for a product, with a safe fallback built from flat fields. */
export function getVariants(p: Product): Variant[] {
  if (p.variants && p.variants.length > 0) return p.variants;
  return [
    {
      color: p.colors?.[0] ?? '',
      price: p.price,
      original_price: p.originalPrice ?? null,
      images: (p.images && p.images.length > 0 ? p.images : [p.image]).filter(Boolean),
      sizes: (p.sizes ?? []).map((s) => ({ size: s, stock: 99 })),
    },
  ];
}

/** Derived flat fields (keeps list/cards/cart/orders working). */
export function deriveFromVariants(variants: Variant[]) {
  const v0 = variants[0];
  const colors = variants.map((v) => v.color).filter(Boolean);
  const sizes = Array.from(new Set(variants.flatMap((v) => v.sizes.map((s) => s.size))));
  const stock = variants.reduce((a, v) => a + v.sizes.reduce((b, s) => b + (Number(s.stock) || 0), 0), 0);
  return {
    price: v0?.price ?? 0,
    original_price: v0?.original_price ?? null,
    colors,
    sizes,
    stock,
    image: v0?.images?.[0] ?? '',
    images: v0?.images ?? [],
  };
}
