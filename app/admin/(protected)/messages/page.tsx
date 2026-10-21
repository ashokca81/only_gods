import { getServerSupabase } from '@/lib/supabase/server';
import MessagesManager, { type MsgRow } from './MessagesManager';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const supabase = await getServerSupabase();
  const { data } = await supabase!
    .from('contact_messages')
    .select('id, name, email, message, created_at')
    .order('created_at', { ascending: false });

  const rows: MsgRow[] = (data ?? []).map((r) => ({
    id: r.id as string,
    name: (r.name as string | null) ?? '',
    email: r.email as string,
    message: r.message as string,
    created_at: r.created_at as string,
  }));

  return <MessagesManager initialRows={rows} />;
}
