import { redirect } from 'next/navigation';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase/server';
import Sidebar from '../_components/Sidebar';
import SignOutButton from '../_components/SignOutButton';
import AdminOrderNotifier from '../_components/AdminOrderNotifier';
import NotConfigured from '../_components/NotConfigured';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured) return <NotConfigured />;

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase!
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="max-w-md w-full rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold mb-2">Not authorized</h1>
          <p className="text-sm text-neutral-600 mb-4">
            Your account ({user.email}) is not an admin. Ask the owner to grant
            admin access, then sign in again.
          </p>
          <div className="flex justify-center">
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-neutral-50 text-neutral-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-8 border-b border-neutral-200 bg-white">
          <h2 className="text-sm font-medium text-neutral-500">Admin Dashboard</h2>
          <div className="flex items-center gap-3">
            <AdminOrderNotifier />
            <span className="text-sm text-neutral-600 hidden sm:inline">
              {profile?.email ?? user.email}
            </span>
            <SignOutButton />
          </div>
        </header>
        {/* Make page-level width caps full-width (nested small cards/modals keep their max-w). */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden [&_.max-w-3xl]:!max-w-none [&_.max-w-4xl]:!max-w-none [&_.max-w-5xl]:!max-w-none [&_.max-w-6xl]:!max-w-none">{children}</main>
      </div>
    </div>
  );
}
