'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import { deriveFromVariants, type Variant } from '@/lib/variants';

export interface ProductInput {
  name: string;
  price: number;
  original_price: number | null;
  image: string;
  images: string[];
  videos: string[];
  variants: Variant[];
  category: string;
  collections: string[];
  brand: string | null;
  sku: string | null;
  stock: number;
  reorder_level: number;
  cost_price: number | null;
  hsn: string | null;
  gst_rate: number | null;
  tags: string[];
  colors: string[];
  sizes: string[];
  description: string;
  details_care: string[];
  shipping_returns: string | null;
  trending: boolean;
  new_arrival: boolean;
  is_active: boolean;
  sort_order: number;
}

type Result = { ok: true } | { ok: false; error: string };

async function client() {
  const supabase = await getServerSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  return supabase;
}

/**
 * Keep the flat columns (price, colors, sizes, stock, image, images) in sync
 * with the first/overall variant so list cards, cart and orders keep working.
 */
function withDerived(input: ProductInput): ProductInput {
  if (!input.variants || input.variants.length === 0) return input;
  const d = deriveFromVariants(input.variants);
  return {
    ...input,
    price: d.price,
    original_price: d.original_price,
    colors: d.colors,
    sizes: d.sizes,
    stock: d.stock,
    image: input.image || d.image,
    images: d.images,
  };
}

export async function createProduct(inputRaw: ProductInput): Promise<Result> {
  const input = withDerived(inputRaw);
  const supabase = await client();
  const { error } = await supabase.from('products').insert(input);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/products');
  revalidatePath('/admin');
  return { ok: true };
}

export async function bulkCreateProducts(
  inputs: ProductInput[]
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (!inputs.length) return { ok: false, error: 'No rows to import' };
  const supabase = await client();
  const prepared = inputs.map(withDerived);
  const { error } = await supabase.from('products').insert(prepared);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/products');
  revalidatePath('/admin');
  return { ok: true, count: inputs.length };
}

export async function updateProduct(
  id: string,
  inputRaw: ProductInput
): Promise<Result> {
  const input = withDerived(inputRaw);
  const supabase = await client();
  const { error } = await supabase.from('products').update(input).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/products');
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<Result> {
  const supabase = await client();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/products');
  revalidatePath('/admin');
  return { ok: true };
}

export async function toggleActive(
  id: string,
  is_active: boolean
): Promise<Result> {
  const supabase = await client();
  const { error } = await supabase
    .from('products')
    .update({ is_active })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/products');
  revalidatePath('/admin');
  return { ok: true };
}
