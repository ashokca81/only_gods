'use client';

import { useQuery } from '@tanstack/react-query';
import { getBrowserSupabase } from '@/lib/supabase/client';
import type { Product } from '@/data/products';
import { rowToProduct, type ProductRow } from '@/lib/products-map';

/**
 * Storefront product source.
 * - Supabase configured  -> live products from the database (admin-controlled).
 * - Not configured / error -> empty list (never show demo/fake products).
 */
export function useProducts() {
  const query = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const supabase = getBrowserSupabase();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error || !data) return [];
      return (data as ProductRow[]).map(rowToProduct);
    },
    // Empty placeholder while loading (isPlaceholderData = true) — pages show a
    // spinner instead of demo products; live DB products always load on mount.
    placeholderData: [],
    staleTime: 15_000,
  });
  // data is always a Product[] (queryFn + placeholder never return undefined)
  return { ...query, data: query.data ?? [] };
}
