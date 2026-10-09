'use client';

import { useState } from 'react';
import { Loader2, Save, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { FlashSale } from '@/lib/flash';
import { isFlashActive } from '@/lib/flash';

const inputCls = 'w-full h-11 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10';
const toLocal = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

export default function FlashForm({ initial }: { initial: FlashSale }) {
  const [f, setF] = useState<FlashSale>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof FlashSale>(k: K, v: FlashSale[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/flash', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flash: f }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setF(j.flash as FlashSale);
      toast.success('Flash sale saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const live = isFlashActive(f);

  return (
    <div className="max-w-3xl mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2"><Zap size={16} /> Flash sale</h2>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        {/* Preview */}
        <div className="rounded-[5px] overflow-hidden">
          <div className="text-center py-2 text-sm font-bold" style={{ background: f.bg, color: f.fg }}>
            ⚡ {f.title || 'Flash Sale'} — {f.percent || 0}% OFF
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.enabled} onChange={(e) => set('enabled', e.target.checked)} className="w-4 h-4" />
          <span className="text-sm font-medium">Enable flash sale</span>
          <span className={`text-[11px] rounded-[5px] px-1.5 py-0.5 font-semibold ${live ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>{live ? 'LIVE now' : 'not live'}</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-neutral-600">Title</span>
            <input className={`${inputCls} mt-1`} value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Diwali Flash Sale" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Discount %</span>
            <input className={`${inputCls} mt-1`} type="number" min={0} max={90} value={f.percent} onChange={(e) => set('percent', Math.min(90, Math.max(0, Number(e.target.value) || 0)))} placeholder="20" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Starts</span>
            <input className={`${inputCls} mt-1`} type="datetime-local" value={toLocal(f.start)} onChange={(e) => set('start', e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Ends (countdown)</span>
            <input className={`${inputCls} mt-1`} type="datetime-local" value={toLocal(f.end)} onChange={(e) => set('end', e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Bar background</span>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={f.bg} onChange={(e) => set('bg', e.target.value)} className="h-11 w-14 rounded-[5px] border border-neutral-200" />
              <input className={inputCls} value={f.bg} onChange={(e) => set('bg', e.target.value)} />
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Bar text colour</span>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={f.fg} onChange={(e) => set('fg', e.target.value)} className="h-11 w-14 rounded-[5px] border border-neutral-200" />
              <input className={inputCls} value={f.fg} onChange={(e) => set('fg', e.target.value)} />
            </div>
          </label>
        </div>
        <p className="text-[11px] text-neutral-400">The % off applies automatically to every order during the window (stacks with coupons, capped at the order value). Product prices show the sale price and a countdown bar appears on the site.</p>
      </div>
    </div>
  );
}
