'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, Save, Plus, Trash2, ArrowUp, ArrowDown, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '@/lib/categories';
import InfoCard from '../../_components/InfoCard';

const inputCls =
  'w-full h-11 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10';

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || 'Upload failed');
  return j.url as string;
}

function Row({
  cat,
  count,
  isFirst,
  isLast,
  onChange,
  onMove,
  onDelete,
}: {
  cat: Category;
  count: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (c: Category) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const doUpload = async (file: File) => {
    setBusy(true);
    try {
      const u = await uploadFile(file);
      onChange({ ...cat, image: u });
      toast.success('Image uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-3 items-start rounded-xl border border-neutral-200 p-3">
      <div className="w-20 h-20 shrink-0 rounded-[5px] overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center">
        {cat.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cat.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={20} className="text-neutral-300" />
        )}
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={cat.name}
            onChange={(e) => onChange({ ...cat, name: e.target.value })}
            placeholder="Category name (used on products)"
            className={inputCls}
          />
          <span className="shrink-0 text-xs text-neutral-500 whitespace-nowrap">{count} items</span>
        </div>
        <div className="flex gap-2">
          <input
            value={cat.image}
            onChange={(e) => onChange({ ...cat, image: e.target.value })}
            placeholder="Image URL (optional)"
            className={inputCls}
          />
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && doUpload(e.target.files[0])} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="shrink-0 h-11 px-3 rounded-[5px] bg-neutral-900 text-white text-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <button type="button" onClick={() => onMove(-1)} disabled={isFirst} className="w-8 h-8 rounded-[5px] border border-neutral-200 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-50">
          <ArrowUp size={14} />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={isLast} className="w-8 h-8 rounded-[5px] border border-neutral-200 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-50">
          <ArrowDown size={14} />
        </button>
        <button type="button" onClick={onDelete} className="w-8 h-8 rounded-[5px] border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function CategoriesManager({
  initialCategories,
  counts,
}: {
  initialCategories: Category[];
  counts: Record<string, number>;
}) {
  const [cats, setCats] = useState<Category[]>(initialCategories);
  const [saving, setSaving] = useState(false);

  const update = (i: number, c: Category) => setCats((prev) => prev.map((x, idx) => (idx === i ? c : x)));
  const move = (i: number, dir: -1 | 1) =>
    setCats((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (i: number) => setCats((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setCats((prev) => [...prev, { name: '', image: '' }]);

  const save = async () => {
    const clean = cats.filter((c) => c.name.trim() !== '');
    if (clean.length === 0) { toast.error('Add at least one category'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: clean }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setCats(j.categories as Category[]);
      toast.success('Categories updated — live on Shop & product form now');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Product groups. These fill the Shop filter bar and the Add-Product dropdown.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
        </button>
      </div>

      <div className="space-y-3">
        {cats.map((c, i) => (
          <Row
            key={i}
            cat={c}
            count={counts[c.name] ?? 0}
            isFirst={i === 0}
            isLast={i === cats.length - 1}
            onChange={(nc) => update(i, nc)}
            onMove={(dir) => move(i, dir)}
            onDelete={() => remove(i)}
          />
        ))}
      </div>

      <button
        onClick={add}
        className="mt-3 inline-flex items-center gap-2 rounded-[5px] border border-dashed border-neutral-300 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50"
      >
        <Plus size={16} /> Add category
      </button>

      <div className="mt-6">
        <InfoCard
          title="How Categories work"
          intro="A category is the group a product belongs to — like Hoodies or Jeans."
          flow={['Name the category', 'Save', 'Pick it on a product', 'It filters the Shop']}
          steps={[
            { title: 'Shop filter', desc: 'Every category here becomes a button in the Shop filter bar.' },
            { title: 'Product dropdown', desc: 'When you add or edit a product, these names appear in the Category dropdown.' },
            { title: 'Counts', desc: 'The “items” number is counted live from products that use this category.' },
            { title: 'Collections are different', desc: 'The Collections page is a separate, curated set of cards — manage it under Collections.' },
          ]}
          note="Name a category exactly the same as what you pick on your products."
        />
      </div>
    </div>
  );
}
