'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, Save, ImageIcon, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { HomeCollection } from '@/lib/homeCollection';
import type { Category } from '@/lib/categories';
import InfoCard from '../../_components/InfoCard';

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || 'Upload failed');
  return j.url as string;
}

export default function HomeCollectionForm({
  initial,
  allCategories,
}: {
  initial: HomeCollection;
  allCategories: Category[];
}) {
  const [stickyImage, setStickyImage] = useState(initial.stickyImage);
  const [titles, setTitles] = useState<string[]>(initial.titles);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggle = (name: string) =>
    setTitles((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));

  const doUpload = async (file: File) => {
    setUploading(true);
    try {
      const u = await uploadFile(file);
      setStickyImage(u);
      toast.success('Image uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    // Keep the saved order aligned with the Categories list order.
    const ordered = allCategories.map((c) => c.name).filter((t) => titles.includes(t));
    setSaving(true);
    try {
      const r = await fetch('/api/admin/home-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeCollection: { stickyImage, titles: ordered } }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setStickyImage(j.homeCollection.stickyImage);
      setTitles(j.homeCollection.titles);
      toast.success('Section updated — live now');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mb-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">&ldquo;The Collection&rdquo; section</h1>
          <p className="text-sm text-neutral-500 mt-1">
            The home split-screen: a sticky image on the left, your chosen Collections on the right.
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

      {/* Left sticky image */}
      <div className="rounded-xl border border-neutral-200 p-4 mb-6">
        <p className="text-sm font-semibold mb-3">Left sticky image</p>
        <div className="flex gap-4 items-start">
          <div className="w-28 h-36 shrink-0 rounded-[5px] overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center">
            {stickyImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stickyImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={22} className="text-neutral-300" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              value={stickyImage}
              onChange={(e) => setStickyImage(e.target.value)}
              placeholder="Image URL"
              className="w-full h-11 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && doUpload(e.target.files[0])} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="h-11 px-4 rounded-[5px] bg-neutral-900 text-white text-sm flex items-center gap-1.5 disabled:opacity-60"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload image
            </button>
          </div>
        </div>
      </div>

      {/* Category picker */}
      <div className="rounded-xl border border-neutral-200 p-4">
        <p className="text-sm font-semibold mb-1">Categories to show</p>
        <p className="text-xs text-neutral-500 mb-3">
          Tick the categories to feature here. Leave all unticked to show every category.
        </p>
        {allCategories.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No categories yet — create some under <span className="font-medium">Categories</span> first.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allCategories.map((c) => {
              const on = titles.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggle(c.name)}
                  className={`flex items-center gap-3 rounded-[5px] border p-2 text-left transition-colors ${on ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'}`}
                >
                  <div className="w-12 h-12 shrink-0 rounded-[5px] overflow-hidden bg-neutral-100 border border-neutral-200">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <span className="flex-1 text-sm font-medium">{c.name}</span>
                  <span className={`w-5 h-5 rounded-[5px] border flex items-center justify-center ${on ? 'bg-black border-black text-white' : 'border-neutral-300 text-transparent'}`}>
                    <Check size={13} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6">
        <InfoCard
          title="How this section works"
          intro="This is the tall split-screen block on the home page — one photo sticks on the left while collection cards scroll on the right."
          flow={['Upload left image', 'Tick categories', 'Save', 'It shows on the home page']}
          steps={[
            { title: 'Left image', desc: 'One tall photo that stays fixed while the right side scrolls. Upload or paste a URL.' },
            { title: 'Right cards', desc: 'Pick which Categories appear as the scrolling cards. Each card links to that category in the shop.' },
            { title: 'Show all', desc: 'If you tick nothing, every category is shown automatically.' },
            { title: 'Counts', desc: 'Each card’s “Products” number is counted live from products in that category.' },
          ]}
          note="Manage the categories themselves (name, cover) under Categories."
        />
      </div>
    </div>
  );
}
