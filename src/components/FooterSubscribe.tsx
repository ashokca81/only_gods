'use client';

import { useState } from 'react';
import { toast } from 'sonner';

/** The footer email capture ("Stay in the know"). Saves to the newsletter list. */
export default function FooterSubscribe() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || done) return;
    setBusy(true);
    try {
      const r = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Subscribe failed');
      setDone(true);
      setEmail('');
      toast.success('Subscribed ✓');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Subscribe failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="relative w-full">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={done}
        placeholder={done ? 'Subscribed ✓' : 'Enter your email'}
        className="w-full bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-800 px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors placeholder-neutral-400 dark:placeholder-neutral-600 disabled:opacity-70"
      />
      <button
        type="submit"
        disabled={busy || done}
        aria-label="Subscribe"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </form>
  );
}
