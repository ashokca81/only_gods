'use server';

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/lib/supabase/server';

export interface CouponInput {
  id?: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  min_order: number;
  max_discount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  is_active: boolean;
}

type Result = { ok: true } | { ok: false; error: string };

async function client() {
  const supabase = await getServerSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  return supabase;
}

export async function saveCoupon(input: CouponInput): Promise<Result> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: 'Code is required' };
  if (!(input.value > 0)) return { ok: false, error: 'Value must be greater than 0' };
  if (input.type === 'percent' && input.value > 100) return { ok: false, error: 'Percent cannot exceed 100' };

  const supabase = await client();
  const row = {
    code,
    type: input.type,
    value: input.value,
    min_order: input.min_order || 0,
    max_discount: input.max_discount,
    starts_at: input.starts_at || null,
    expires_at: input.expires_at || null,
    usage_limit: input.usage_limit,
    per_customer_limit: input.per_customer_limit,
    is_active: input.is_active,
  };

  const { error } = input.id
    ? await supabase.from('coupons').update(row).eq('id', input.id)
    : await supabase.from('coupons').insert(row);

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'That code already exists' };
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/coupons');
  return { ok: true };
}

export async function deleteCoupon(id: string): Promise<Result> {
  const supabase = await client();
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/coupons');
  return { ok: true };
}

export async function toggleCouponActive(id: string, is_active: boolean): Promise<Result> {
  const supabase = await client();
  const { error } = await supabase.from('coupons').update({ is_active }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/coupons');
  return { ok: true };
}
