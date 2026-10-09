'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';

type Result = { ok: true } | { ok: false; error: string };

export async function deleteCart(customerId: string): Promise<Result> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: 'Not configured' };
  const { error } = await supabase.from('carts').delete().eq('customer_id', customerId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/abandoned');
  return { ok: true };
}
