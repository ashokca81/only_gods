import { redirect } from 'next/navigation';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase/server';
import LabelView, { type LabelOrder } from './LabelView';

export const dynamic = 'force-dynamic';

export default async function OrderLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured) redirect('/admin/login');
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) redirect(`/admin/login?next=/admin/orders/${id}/label`);

  const { data: profile } = await supabase!
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/admin/login');

  const { data: order } = await supabase!
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single();

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-500">
        Order not found.
      </div>
    );
  }

  return <LabelView order={order as LabelOrder} />;
}
