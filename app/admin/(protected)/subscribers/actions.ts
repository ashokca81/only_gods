'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';

type Result = { ok: true } | { ok: false; error: string };

export async function deleteSubscriber(id: string): Promise<Result> {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: false, error: 'Not configured' };
  const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/subscribers');
  return { ok: true };
}
