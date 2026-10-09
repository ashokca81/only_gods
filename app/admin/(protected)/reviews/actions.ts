'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';

type Result = { ok: true } | { ok: false; error: string };

async function client() {
  const supabase = await getServerSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  return supabase;
}

export async function setReviewApproved(id: string, approved: boolean): Promise<Result> {
  const supabase = await client();
  const { error } = await supabase.from('reviews').update({ is_approved: approved }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/reviews');
  return { ok: true };
}

export async function deleteReview(id: string): Promise<Result> {
  const supabase = await client();
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/reviews');
  return { ok: true };
}
