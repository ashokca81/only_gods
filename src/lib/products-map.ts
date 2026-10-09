import type { Product } from '@/data/products';
import type { Variant } from '@/lib/variants';

/** Shape of a row in the Supabase `products` table. */
export interface ProductRow {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image: string;
  category: string;
  collections?: string[] | null;
  colors: string[] | null;
  sizes: string[] | null;
  description: string | null;
  trending: boolean | null;
  new_arrival: boolean | null;
  is_active?: boolean | null;
  sort_order?: number | null;
  images?: string[] | null;
  videos?: string[] | null;
  sku?: string | null;
  stock?: number | null;
  reorder_level?: number | null;
  cost_price?: number | null;
  hsn?: string | null;
  gst_rate?: number | null;
  brand?: string | null;
  tags?: string[] | null;
  variants?: Variant[] | null;
  details_care?: string[] | null;
  shipping_returns?: string | null;
}

/** Map a DB row to the Product type the storefront already uses. */
export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    image: row.image,
    images: row.images ?? [],
    videos: row.videos ?? [],
    variants: row.variants ?? [],
    brand: row.brand ?? undefined,
    category: row.category,
    collections: row.collections ?? [],
    stock: row.stock != null ? Number(row.stock) : undefined,
    colors: row.colors ?? [],
    sizes: row.sizes ?? [],
    description: row.description ?? '',
    detailsCare: row.details_care ?? [],
    shippingReturns: row.shipping_returns ?? '',
    trending: row.trending ?? false,
    newArrival: row.new_arrival ?? false,
  };
}
