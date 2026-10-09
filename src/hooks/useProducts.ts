'use client';

import { useQuery } from '@tanstack/react-query';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { products as staticProducts, type Product } from '@/data/products';
import { rowToProduct, type ProductRow } from '@/lib/products-map';

/**
 * Storefront product source.
 * - Supabase configured  -> live products from the database (admin-controlled).
 * - Not configured / error -> bundled static products (safe fallback, no breakage).
 */
export function useProducts() {
  const query = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const supabase = getBrowserSupabase();
      if (!supabase) return staticProducts;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error || !data) return staticProducts;
      return (data as ProductRow[]).map(rowToProduct);
    },
    // placeholderData (not initialData) paints instantly from the bundled list
    // but still always fetches the live DB products on mount, so admin edits,
    // new products and per-colour variants show up.
    placeholderData: staticProducts,
    staleTime: 15_000,
  });
  // data is always a Product[] (queryFn + placeholder never return undefined)
  return { ...query, data: query.data ?? staticProducts };
}
