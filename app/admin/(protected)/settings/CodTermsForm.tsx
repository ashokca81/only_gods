'use client';

import { useState } from 'react';
import { Loader2, Save, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CodTermsConfig } from '@/lib/codTerms';

const inputCls = 'w-full h-11 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10';

export default function CodTermsForm({ initial }: { initial: CodTermsConfig }) {
  const [t, setT] = useState<CodTermsConfig>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof CodTermsConfig>(k: K, v: CodTermsConfig[K]) => setT((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/cod-terms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codTerms: t }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setT(j.codTerms as CodTermsConfig);
      toast.success('COD Terms updated — live at checkout');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2"><FileCheck2 size={16} /> COD Terms &amp; Conditions</h2>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        <p className="text-sm text-neutral-500">
          Shown in a popup when a customer accepts the Terms before placing a <strong>Cash on Delivery</strong> order.
        </p>

        <label className="block">
          <span className="text-sm text-neutral-600">Title</span>
          <input className={`${inputCls} mt-1`} value={t.title} onChange={(e) => set('title', e.target.value)} placeholder="Cash on Delivery — Terms & Conditions" />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-600">Terms text</span>
          <textarea
            className="w-full mt-1 px-3 py-2 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-y"
            rows={9}
            value={t.body}
            onChange={(e) => set('body', e.target.value)}
            placeholder="Write the terms here. Press Enter for a new line."
          />
          <span className="text-[11px] text-neutral-400">Line breaks are kept exactly as typed.</span>
        </label>
      </div>
    </div>
  );
}
