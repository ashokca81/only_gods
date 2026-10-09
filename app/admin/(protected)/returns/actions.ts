'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';

type Result = { ok: true } | { ok: false; error: string };
const STATUSES = ['requested', 'approved', 'rejected', 'refunded'];

export async function setReturnStatus(id: string, status: string, refundAmount?: number | null): Promise<Result> {
  if (!STATUSES.includes(status)) return { ok: false, error: 'Invalid status' };
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: 'Not configured' };
  const patch: Record<string, unknown> = { status };
  if (status === 'refunded') patch.refund_amount = refundAmount ?? null;
  const { error } = await supabase.from('returns').update(patch).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/returns');
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteReturn(id: string): Promise<Result> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: 'Not configured' };
  const { error } = await supabase.from('returns').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/returns');
  return { ok: true };
}
