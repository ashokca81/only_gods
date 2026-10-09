'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

/** Site-wide "Join the Club of Gods" newsletter section (every page, via Footer). */
export default function NewsletterSignup() {
  const pathname = usePathname();
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
        body: JSON.stringify({ email, source: `section:${pathname || '/'}` }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Subscribe failed');
      setDone(true);
      setEmail('');
      toast.success('Subscribed — welcome to the club ✓');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Subscribe failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="py-32 bg-black text-white dark:bg-white dark:text-black text-center px-4">
      <div className="max-w-3xl mx-auto">
        <div className="h-12 md:h-16 flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_white.png" alt="Only Gods" className="h-full w-auto object-contain block dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dark_logo.png" alt="Only Gods" className="h-full w-auto object-contain hidden dark:block" />
        </div>
        <h2 className="text-[6vw] sm:text-3xl md:text-4xl lg:text-6xl whitespace-nowrap font-black uppercase tracking-tight mb-6 font-display">
          Join the Club of Gods
        </h2>
        <p className="text-lg text-white/60 dark:text-black/60 mb-10">
          Sign up for exclusive access to drops, limited editions, and private sales.
        </p>
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={done}
            placeholder="ENTER YOUR EMAIL"
            className="flex-1 bg-transparent border-b-2 border-white dark:border-black px-4 py-3 text-lg placeholder:text-white/40 dark:placeholder:text-black/40 focus:outline-none focus:border-white dark:focus:border-black transition-colors uppercase font-bold text-center sm:text-left disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || done}
            className="bg-white text-black dark:bg-black dark:text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors disabled:opacity-60"
          >
            {done ? 'Subscribed ✓' : busy ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  );
}
