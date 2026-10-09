import { getServerSupabase } from '@/lib/supabase/server';
import SubscribersManager, { type SubRow } from './SubscribersManager';

export const dynamic = 'force-dynamic';

export default async function SubscribersPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!
    .from('newsletter_subscribers')
    .select('id, email, source, created_at')
    .order('created_at', { ascending: false });

  const rows: SubRow[] = (data ?? []).map((r) => ({
    id: r.id as string,
    email: r.email as string,
    source: (r.source as string | null) ?? '',
    created_at: r.created_at as string,
  }));

  return <SubscribersManager initialRows={rows} />;
}
