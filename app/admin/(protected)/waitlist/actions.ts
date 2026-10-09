'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';

type Result = { ok: true } | { ok: false; error: string };

export async function setNotified(id: string, notified: boolean): Promise<Result> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: 'Not configured' };
  const { error } = await supabase.from('stock_notifications').update({ notified }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/waitlist');
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteNotification(id: string): Promise<Result> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: 'Not configured' };
  const { error } = await supabase.from('stock_notifications').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/waitlist');
  return { ok: true };
}
