'use client';

import { useState } from 'react';
import { Loader2, Save, Ruler, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SizeGuideConfig } from '@/lib/sizeGuide';

export default function SizeGuideForm({ initial }: { initial: SizeGuideConfig }) {
  const [sg, setSg] = useState<SizeGuideConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Upload failed');
      setSg({ image: j.url as string });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/size-guide', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sizeGuide: sg }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setSg(j.sizeGuide as SizeGuideConfig);
      toast.success('Default size guide updated — live now');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2"><Ruler size={16} /> Default Size Guide</h2>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        <p className="text-sm text-neutral-500">
          Shown in the <strong>Size Guide</strong> popup on every product that doesn&apos;t have its own size-chart image.
          A product&apos;s own image (set on the product page) always wins.
        </p>

        {sg.image ? (
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sg.image} alt="Size guide" className="max-h-72 w-auto rounded-[5px] border border-neutral-200 object-contain bg-white" />
            <button type="button" onClick={() => setSg({ image: '' })} className="text-sm text-red-500 inline-flex items-center gap-1"><Trash2 size={14} /> Remove</button>
          </div>
        ) : (
          <label className="inline-flex items-center gap-2 cursor-pointer rounded-[5px] border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-600 hover:bg-neutral-50">
            <Upload size={15} /> {uploading ? 'Uploading…' : 'Upload size chart image'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f); }} />
          </label>
        )}
      </div>
    </div>
  );
}
