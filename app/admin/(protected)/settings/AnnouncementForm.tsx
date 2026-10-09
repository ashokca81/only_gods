'use client';

import { useState } from 'react';
import { Loader2, Save, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import type { AnnouncementConfig } from '@/lib/announcement';

const inputCls = 'w-full h-11 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10';

export default function AnnouncementForm({ initial }: { initial: AnnouncementConfig }) {
  const [a, setA] = useState<AnnouncementConfig>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof AnnouncementConfig>(k: K, v: AnnouncementConfig[K]) => setA((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/announcement', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement: a }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setA(j.announcement as AnnouncementConfig);
      toast.success('Announcement bar updated — live on your site');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2"><Megaphone size={16} /> Announcement bar</h2>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        {/* Live preview */}
        <div className="rounded-[5px] overflow-hidden">
          <div className="text-center py-2 text-sm font-medium" style={{ background: a.bg, color: a.fg }}>
            {a.text || 'Your announcement text…'}
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={a.enabled} onChange={(e) => set('enabled', e.target.checked)} className="w-4 h-4" />
          <span className="text-sm font-medium">Show the bar on the website</span>
        </label>

        <label className="block">
          <span className="text-sm text-neutral-600">Text</span>
          <input className={`${inputCls} mt-1`} value={a.text} onChange={(e) => set('text', e.target.value)} placeholder="Free shipping on orders above ₹2000 🚚" />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-600">Link (optional)</span>
          <input className={`${inputCls} mt-1`} value={a.link} onChange={(e) => set('link', e.target.value)} placeholder="/shop or https://…" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-neutral-600">Background colour</span>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={a.bg} onChange={(e) => set('bg', e.target.value)} className="h-11 w-14 rounded-[5px] border border-neutral-200" />
              <input className={inputCls} value={a.bg} onChange={(e) => set('bg', e.target.value)} />
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Text colour</span>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={a.fg} onChange={(e) => set('fg', e.target.value)} className="h-11 w-14 rounded-[5px] border border-neutral-200" />
              <input className={inputCls} value={a.fg} onChange={(e) => set('fg', e.target.value)} />
            </div>
          </label>
        </div>
        <p className="text-[11px] text-neutral-400">Customers can dismiss the bar; it reappears when you change the text.</p>
      </div>
    </div>
  );
}
