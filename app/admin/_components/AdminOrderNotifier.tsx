'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Bell, BellOff } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const POLL_MS = 30_000;

/** While the admin dashboard is open, gently poll for new orders and alert. */
export default function AdminOrderNotifier() {
  const lastSeen = useRef<string | null>(null);
  const booted = useRef(false);
  const baseTitle = useRef('');
  const [sound, setSound] = useState(true);

  useEffect(() => {
    baseTitle.current = document.title;
    setSound(localStorage.getItem('og_admin_sound') !== 'off');
  }, []);

  const beep = () => {
    if (localStorage.getItem('og_admin_sound') === 'off') return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(); o.stop(ctx.currentTime + 0.4);
    } catch { /* ignore */ }
  };

  const check = async () => {
    try {
      const r = await fetch('/api/admin/new-orders', { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      const latest = j.latest as { order_no: string; customer_name: string; total: number; created_at: string } | null;
      const pending = Number(j.pending) || 0;

      if (!booted.current) {
        booted.current = true;
        lastSeen.current = latest?.created_at ?? null;
      } else if (latest && latest.created_at !== lastSeen.current) {
        lastSeen.current = latest.created_at;
        beep();
        toast.custom(() => (
          <Link href="/admin/orders" className="block rounded-[5px] bg-neutral-900 text-white px-4 py-3 shadow-lg">
            <p className="font-semibold text-sm">🛎️ New order — {latest.order_no}</p>
            <p className="text-xs text-white/80">{latest.customer_name} · {formatPrice(Number(latest.total))} — tap to view</p>
          </Link>
        ), { duration: 8000 });
      }
      document.title = pending > 0 ? `(${pending}) ${baseTitle.current}` : baseTitle.current;
    } catch { /* ignore */ }
  };

  useEffect(() => {
    check();
    const id = setInterval(check, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    localStorage.setItem('og_admin_sound', next ? 'on' : 'off');
    toast.success(next ? 'Order sound on' : 'Order sound off');
  };

  return (
    <button onClick={toggleSound} title={sound ? 'Order sound on' : 'Order sound off'} className="text-neutral-500 hover:text-neutral-900">
      {sound ? <Bell size={18} /> : <BellOff size={18} />}
    </button>
  );
}
