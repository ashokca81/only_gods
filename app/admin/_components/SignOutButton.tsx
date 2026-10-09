'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { getBrowserSupabase } from '@/lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();

  const signOut = async () => {
    const supabase = getBrowserSupabase();
    if (supabase) await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button
      onClick={signOut}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
    >
      <LogOut size={16} />
      Sign out
    </button>
  );
}
