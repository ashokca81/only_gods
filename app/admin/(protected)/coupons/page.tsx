import { getServerSupabase } from '@/lib/supabase/server';
import CouponsManager, { type CouponRow } from './CouponsManager';

export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return <CouponsManager initialCoupons={(data ?? []) as CouponRow[]} />;
}
