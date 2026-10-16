'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, Save, Plus, Trash2, ArrowUp, ArrowDown, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { CarouselSlide } from '@/lib/carousel';
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

function ImagePick({ label, value, onChange, aspect }: { label: string; value: string; onChange: (u: string) => void; aspect: string }) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const doUpload = async (file: File) => {
    setBusy(true);
    try { onChange(await uploadFile(file)); toast.success('Image uploaded'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setBusy(false); }
  };
  return (
    <div>
      <p className="text-xs font-semibold text-neutral-600 mb-1">{label}</p>
      <div className="flex gap-2 items-start">
        <div className={`${aspect} w-20 shrink-0 rounded-[5px] overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : <ImageIcon size={18} className="text-neutral-300" />}
        </div>
        <div className="flex-1 space-y-2">
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL" className={inputCls} />
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && doUpload(e.target.files[0])} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="h-10 px-3 rounded-[5px] bg-neutral-900 text-white text-sm flex items-center gap-1.5 disabled:opacity-60">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ slide, index, isFirst, isLast, categories, onChange, onMove, onDelete }: {
  slide: CarouselSlide; index: number; isFirst: boolean; isLast: boolean; categories: Category[];
  onChange: (s: CarouselSlide) => void; onMove: (d: -1 | 1) => void; onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Slide {index + 1}</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={isFirst} className="w-8 h-8 rounded-[5px] border border-neutral-200 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-50"><ArrowUp size={14} /></button>
          <button type="button" onClick={() => onMove(1)} disabled={isLast} className="w-8 h-8 rounded-[5px] border border-neutral-200 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-50"><ArrowDown size={14} /></button>
          <button type="button" onClick={onDelete} className="w-8 h-8 rounded-[5px] border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50"><Trash2 size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <ImagePick label="Desktop image (wide)" value={slide.desktopImage} onChange={(u) => onChange({ ...slide, desktopImage: u })} aspect="h-14" />
        <ImagePick label="Mobile image (tall)" value={slide.mobileImage} onChange={(u) => onChange({ ...slide, mobileImage: u })} aspect="h-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-neutral-600 mb-1">Title (shown on the slide)</p>
          <input value={slide.title} onChange={(e) => onChange({ ...slide, title: e.target.value })} placeholder="e.g. Yacht Collection" className={inputCls} />
        </div>
        <div>
          <p className="text-xs font-semibold text-neutral-600 mb-1">Links to category</p>
          <select value={slide.category} onChange={(e) => onChange({ ...slide, category: e.target.value })} className={inputCls}>
            <option value="">— pick a category —</option>
            {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function CarouselForm({ initial, allCategories }: { initial: CarouselSlide[]; allCategories: Category[] }) {
  const [slides, setSlides] = useState<CarouselSlide[]>(initial);
  const [saving, setSaving] = useState(false);

  const update = (i: number, s: CarouselSlide) => setSlides((p) => p.map((x, idx) => (idx === i ? s : x)));
  const move = (i: number, dir: -1 | 1) => setSlides((p) => { const j = i + dir; if (j < 0 || j >= p.length) return p; const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const remove = (i: number) => setSlides((p) => p.filter((_, idx) => idx !== i));
  const add = () => setSlides((p) => [...p, { desktopImage: '', mobileImage: '', title: '', category: '' }]);

  const save = async () => {
    const clean = slides.filter((s) => s.desktopImage.trim() || s.mobileImage.trim());
    if (clean.length === 0) { toast.error('Add at least one slide with an image'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/admin/carousel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slides: clean }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setSlides(j.slides as CarouselSlide[]);
      toast.success('Carousel updated — live now');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mb-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Home carousel</h1>
          <p className="text-sm text-neutral-500 mt-1">Full-screen slides on desktop, swipeable cards on mobile.</p>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
        </button>
      </div>

      <div className="space-y-3">
        {slides.map((s, i) => (
          <Row key={i} slide={s} index={i} isFirst={i === 0} isLast={i === slides.length - 1} categories={allCategories}
            onChange={(ns) => update(i, ns)} onMove={(d) => move(i, d)} onDelete={() => remove(i)} />
        ))}
      </div>

      <button onClick={add} className="mt-3 inline-flex items-center gap-2 rounded-[5px] border border-dashed border-neutral-300 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50">
        <Plus size={16} /> Add slide
      </button>

      <div className="mt-6">
        <InfoCard
          title="How the carousel works"
          intro="The big rotating banner on the home page. Each slide has its own desktop and mobile image and links to a category."
          flow={['Add a slide', 'Upload both images', 'Pick a category', 'Save']}
          steps={[
            { title: 'Two images', desc: 'Desktop image is wide (shown full-screen); mobile image is tall (shown as a card). Upload or paste a URL for each.' },
            { title: 'Title', desc: 'Optional text shown over the image (e.g. “Yacht Collection”).' },
            { title: 'Category link', desc: 'Tapping the slide opens that category in the shop. Pick it from the dropdown.' },
            { title: 'Order & auto-play', desc: 'Reorder with the arrows. On desktop the slides auto-rotate; on mobile customers swipe.' },
          ]}
          note="Manage the categories themselves under Categories."
        />
      </div>
    </div>
  );
}
