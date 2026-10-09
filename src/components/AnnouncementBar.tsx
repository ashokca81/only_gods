'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { type AnnouncementConfig } from '@/lib/announcement';
import { useFlash } from '@/hooks/useFlash';
import { isFlashActive } from '@/lib/flash';

function countdown(end: string): string {
  const ms = Date.parse(end) - Date.now();
  if (ms <= 0) return '';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (d > 0 ? `${d}d ` : '') + `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export default function AnnouncementBar() {
  const pathname = usePathname();
  const flash = useFlash();
  const [annc, setAnnc] = useState<AnnouncementConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    fetch('/api/settings/announcement').then((r) => r.json()).then((j) => setAnnc(j?.announcement ?? null)).catch(() => {});
  }, []);

  const flashOn = isFlashActive(flash);

  // Tick every second while a flash countdown is running.
  useEffect(() => {
    if (!flashOn || !flash.end) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [flashOn, flash.end]);

  // Announcement dismissal (per text).
  useEffect(() => {
    if (!annc?.enabled || !annc.text?.trim()) return;
    try {
      const key = `og_annc_${btoa(unescape(encodeURIComponent(annc.text))).slice(0, 24)}`;
      if (localStorage.getItem(key)) setDismissed(true);
    } catch { /* ignore */ }
  }, [annc]);

  const onAdmin = pathname?.startsWith('/admin');
  const showFlash = !onAdmin && flashOn;
  const showAnnc = !onAdmin && !showFlash && !!annc?.enabled && !!annc.text?.trim() && !dismissed;
  const visible = showFlash || showAnnc;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--annc-h', visible ? '34px' : '0px');
    return () => root.style.setProperty('--annc-h', '0px');
  }, [visible]);

  if (showFlash) {
    const left = flash.end ? countdown(flash.end) : '';
    return (
      <div className="fixed top-0 inset-x-0 z-[60] text-center py-2 px-4 flex items-center justify-center gap-2" style={{ background: flash.bg, color: flash.fg, height: 34 }}>
        <span className="text-xs sm:text-sm font-bold tracking-wide">⚡ {flash.title} — {flash.percent}% OFF</span>
        {left && <span className="text-xs sm:text-sm font-mono tabular-nums opacity-90">· ends in {left}</span>}
      </div>
    );
  }

  if (showAnnc && annc) {
    const close = () => {
      setDismissed(true);
      try { localStorage.setItem(`og_annc_${btoa(unescape(encodeURIComponent(annc.text))).slice(0, 24)}`, '1'); } catch { /* ignore */ }
    };
    const content = <span className="text-xs sm:text-sm font-medium tracking-wide">{annc.text}</span>;
    return (
      <div className="fixed top-0 inset-x-0 z-[60] text-center py-2 px-10" style={{ background: annc.bg, color: annc.fg, height: 34 }}>
        {annc.link ? <a href={annc.link} target={annc.link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="hover:underline">{content}</a> : content}
        <button onClick={close} aria-label="Dismiss" className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"><X size={16} /></button>
      </div>
    );
  }

  return null;
}
