'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';
import { ORDER_STATUSES, type OrderStatus } from './constants';

type Result = { ok: true } | { ok: false; error: string };

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Result> {
  if (!ORDER_STATUSES.includes(status)) {
    return { ok: false, error: 'Invalid status' };
  }
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not configured' };
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { ok: true };
}

export async function updateShipping(
  id: string,
  shipping: { courier: string | null; tracking_number: string | null; tracking_url: string | null }
): Promise<Result> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: 'Supabase not configured' };
  const clean = {
    courier: shipping.courier?.trim() || null,
    tracking_number: shipping.tracking_number?.trim() || null,
    tracking_url: shipping.tracking_url?.trim() || null,
  };
  const { error } = await supabase.from('orders').update(clean).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/orders');
  return { ok: true };
}
