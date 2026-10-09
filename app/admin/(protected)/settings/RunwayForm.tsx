'use client';

import { useState } from 'react';
import { Loader2, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Collection } from '@/lib/collections';
import InfoCard from '../../_components/InfoCard';

export default function RunwayForm({
  initialTitles,
  allCollections,
}: {
  initialTitles: string[];
  allCollections: Collection[];
}) {
  const [titles, setTitles] = useState<string[]>(initialTitles);
  const [saving, setSaving] = useState(false);

  const toggle = (title: string) =>
    setTitles((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]));

  const save = async () => {
    // Keep the saved order aligned with the Collections list order.
    const ordered = allCollections.map((c) => c.title).filter((t) => titles.includes(t));
    setSaving(true);
    try {
      const r = await fetch('/api/admin/runway-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runway: { titles: ordered } }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setTitles(j.runway.titles);
      toast.success('Runway updated — live now');
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
          <h1 className="text-2xl font-bold">Runway (The Season)</h1>
          <p className="text-sm text-neutral-500 mt-1">
            The big scrolling gallery on the home page — pick which Collections show here.
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

      <div className="rounded-xl border border-neutral-200 p-4">
        <p className="text-sm font-semibold mb-1">Collections in the Runway</p>
        <p className="text-xs text-neutral-500 mb-3">
          Tick the collections to feature here. Leave all unticked to show every collection.
        </p>
        {allCollections.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No collections yet — create some under <span className="font-medium">Collections</span> first.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allCollections.map((c) => {
              const on = titles.includes(c.title);
              return (
                <button
                  key={c.title}
                  type="button"
                  onClick={() => toggle(c.title)}
                  className={`flex items-center gap-3 rounded-[5px] border p-2 text-left transition-colors ${on ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'}`}
                >
                  <div className="w-12 h-12 shrink-0 rounded-[5px] overflow-hidden bg-neutral-100 border border-neutral-200">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <span className="flex-1 text-sm font-medium">{c.title}</span>
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
          title="How the Runway section works"
          intro="This is the large scrolling campaign gallery on the home page. It shows your Collections."
          flow={['Create collections', 'Tick them here', 'Save', 'They show on the home page']}
          steps={[
            { title: 'Pick collections', desc: 'Tick the collections you want in the Runway. Each card links to that collection in the shop.' },
            { title: 'Show all', desc: 'If you tick nothing, every collection is shown automatically.' },
            { title: 'Order', desc: 'Cards follow your Collections order — reorder them under Collections.' },
            { title: 'Images', desc: 'Each card uses the collection’s cover image, set under Collections.' },
          ]}
          note="Manage the collections themselves (name, cover) under Collections."
        />
      </div>
    </div>
  );
}
