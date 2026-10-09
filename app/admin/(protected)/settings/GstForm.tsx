'use client';

import { useState } from 'react';
import { Loader2, Save, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import type { GstConfig } from '@/lib/gst';

const inputCls = 'w-full h-11 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10';

export default function GstForm({ initial }: { initial: GstConfig }) {
  const [g, setG] = useState<GstConfig>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof GstConfig>(k: K, v: GstConfig[K]) => setG((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/gst', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gst: g }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setG(j.gst as GstConfig);
      toast.success('GST settings saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2"><Receipt size={16} /> GST / Tax invoice</h2>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={g.enabled} onChange={(e) => set('enabled', e.target.checked)} className="w-4 h-4" />
          <span className="text-sm font-medium">Show GST breakup on invoices (Tax Invoice)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-neutral-600">GSTIN</span>
            <input className={`${inputCls} mt-1 uppercase`} value={g.gstin} onChange={(e) => set('gstin', e.target.value.toUpperCase())} placeholder="37ABCDE1234F1Z5" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Legal / business name</span>
            <input className={`${inputCls} mt-1`} value={g.legal_name} onChange={(e) => set('legal_name', e.target.value)} placeholder="ONLY GODS" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">State (place of supply)</span>
            <input className={`${inputCls} mt-1`} value={g.state} onChange={(e) => set('state', e.target.value)} placeholder="Andhra Pradesh" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Default GST rate %</span>
            <input className={`${inputCls} mt-1`} type="number" min={0} value={g.default_rate} onChange={(e) => set('default_rate', Math.max(0, Number(e.target.value) || 0))} placeholder="5" />
          </label>
        </div>
        <p className="text-[11px] text-neutral-400">Prices are treated as GST-inclusive — the tax is calculated inside the price, so customer totals do not change. Same state as the buyer → CGST + SGST; different state → IGST. Set HSN & rate per product (optional) in the product form.</p>
      </div>
    </div>
  );
}
