'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';

type Result = { ok: true; newStock: number } | { ok: false; error: string };

async function client() {
  const supabase = await getServerSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  return supabase;
}

/** Set a product's stock to an absolute value and log the movement. */
export async function setStock(
  id: string,
  newStock: number,
  reason = 'manual',
  note?: string
): Promise<Result> {
  if (!Number.isFinite(newStock) || newStock < 0) return { ok: false, error: 'Invalid stock value' };
  const supabase = await client();

  const { data: prod, error: readErr } = await supabase.from('products').select('stock').eq('id', id).single();
  if (readErr) return { ok: false, error: readErr.message };
  const current = Number(prod?.stock) || 0;
  const change = newStock - current;

  const { error: upErr } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
  if (upErr) return { ok: false, error: upErr.message };

  await supabase.from('stock_movements').insert({ product_id: id, change, new_stock: newStock, reason, note: note ?? null });

  revalidatePath('/admin/inventory');
  revalidatePath('/admin');
  revalidatePath('/admin/products');
  return { ok: true, newStock };
}

/** Adjust stock by a relative delta (+in / -out). */
export async function adjustStock(id: string, delta: number, reason = 'manual', note?: string): Promise<Result> {
  const supabase = await client();
  const { data: prod, error } = await supabase.from('products').select('stock').eq('id', id).single();
  if (error) return { ok: false, error: error.message };
  const next = Math.max(0, (Number(prod?.stock) || 0) + delta);
  return setStock(id, next, reason, note);
}

/** Update a product's reorder level. */
export async function setReorderLevel(id: string, level: number): Promise<Result> {
  if (!Number.isFinite(level) || level < 0) return { ok: false, error: 'Invalid level' };
  const supabase = await client();
  const { error } = await supabase.from('products').update({ reorder_level: level }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/inventory');
  return { ok: true, newStock: level };
}

export interface Movement {
  id: string;
  change: number;
  new_stock: number;
  reason: string;
  note: string | null;
  created_at: string;
}

/** Recent stock movements for one product. */
export async function getStockHistory(id: string): Promise<Movement[]> {
  const supabase = await client();
  const { data } = await supabase
    .from('stock_movements')
    .select('id, change, new_stock, reason, note, created_at')
    .eq('product_id', id)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data ?? []) as Movement[];
}
