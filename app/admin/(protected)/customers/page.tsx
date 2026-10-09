import { getServerSupabase } from '@/lib/supabase/server';
import CustomersManager, { type CustomerRow } from './CustomersManager';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!
    .from('customers')
    .select(
      'id, phone, name, avatar_url, created_at, addresses(id, name, phone, line, city, state, pincode, is_default), orders(id, total, status, created_at, customer_email)'
    )
    .order('created_at', { ascending: false });

  return <CustomersManager initialCustomers={(data ?? []) as CustomerRow[]} />;
}
