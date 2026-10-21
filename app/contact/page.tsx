'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DEFAULT_PAGES, mergePageContent, type PageContent } from '@/lib/pageContent';
import { toast } from 'sonner';

const iconFor = (heading: string) => {
  const h = heading.toLowerCase();
  if (h.includes('email') || h.includes('mail')) return Mail;
  if (h.includes('phone') || h.includes('call')) return Phone;
  if (h.includes('address') || h.includes('location')) return MapPin;
  if (h.includes('hour') || h.includes('time')) return Clock;
  return Mail;
};

export default function ContactPage() {
  const [page, setPage] = useState<PageContent>(DEFAULT_PAGES.contact);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/settings/page/contact')
      .then((r) => r.json())
      .then((j) => { if (alive && j?.page) setPage(mergePageContent(j.page, 'contact')); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const r = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Could not send');
      setSent(true);
      setForm({ name: '', email: '', message: '' });
      toast.success('Message sent — we’ll get back to you soon.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white pb-20 lg:pb-0 flex flex-col">
      <Navbar />

      <header className="pt-28 md:pt-36 pb-10 md:pb-14 px-4 border-b border-black/10 dark:border-white/10">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-black/40 dark:text-white/40 mb-3">We&rsquo;re Listening</p>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight font-display">{page.title || 'Contact Us'}</h1>
          {page.intro.trim() !== '' && (
            <p className="mt-5 text-base md:text-lg text-black/60 dark:text-white/60 leading-relaxed max-w-2xl mx-auto">{page.intro}</p>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16">

          {/* Contact details (dashboard-editable) */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-black/50 dark:text-white/50">Reach Us</h2>
            <div className="space-y-4">
              {page.sections.map((s, i) => {
                const Icon = iconFor(s.heading);
                return (
                  <div key={i} className="flex items-start gap-4 rounded-2xl border border-black/10 dark:border-white/10 p-5">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-black/40 dark:text-white/40 mb-1">{s.heading}</p>
                      <p className="text-sm md:text-base font-medium break-words whitespace-pre-line">{s.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Message form */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 md:p-8 bg-black/[0.02] dark:bg-white/[0.03]">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide font-display mb-6">Send a Message</h2>
            {sent ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center mb-4"><Send size={22} /></div>
                <p className="font-bold uppercase tracking-wide">Message sent</p>
                <p className="text-sm text-black/60 dark:text-white/60 mt-1">We&rsquo;ll get back to you soon.</p>
                <button onClick={() => setSent(false)} className="mt-6 text-xs font-bold uppercase tracking-widest underline underline-offset-4">Send another</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <label className="block">
                  <span className="block text-[11px] uppercase tracking-[0.2em] text-black/50 dark:text-white/50 mb-1.5">Your Name</span>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name"
                    className="w-full bg-transparent border border-black/15 dark:border-white/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors" />
                </label>
                <label className="block">
                  <span className="block text-[11px] uppercase tracking-[0.2em] text-black/50 dark:text-white/50 mb-1.5">Email *</span>
                  <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@email.com"
                    className="w-full bg-transparent border border-black/15 dark:border-white/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors" />
                </label>
                <label className="block">
                  <span className="block text-[11px] uppercase tracking-[0.2em] text-black/50 dark:text-white/50 mb-1.5">Message *</span>
                  <textarea required rows={5} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="How can we help?"
                    className="w-full bg-transparent border border-black/15 dark:border-white/15 rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:border-black dark:focus:border-white transition-colors" />
                </label>
                <button type="submit" disabled={sending}
                  className="w-full py-4 bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
