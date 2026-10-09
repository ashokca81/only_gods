'use client';

import { useState } from 'react';
import { Loader2, Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import type { PageContent, PageSlug } from '@/lib/pageContent';
import InfoCard from '../../_components/InfoCard';

const inputCls =
  'w-full h-11 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10';
const areaCls =
  'w-full px-3 py-2 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10';

export default function PageContentForm({ slug, label, initial }: { slug: PageSlug; label: string; initial: PageContent }) {
  const [page, setPage] = useState<PageContent>(initial);
  const [saving, setSaving] = useState(false);
  const isFaq = slug === 'faq';

  const setField = (k: 'title' | 'intro', v: string) => setPage((p) => ({ ...p, [k]: v }));
  const setSection = (i: number, k: 'heading' | 'body', v: string) =>
    setPage((p) => ({ ...p, sections: p.sections.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)) }));
  const addSection = () => setPage((p) => ({ ...p, sections: [...p.sections, { heading: '', body: '' }] }));
  const removeSection = (i: number) => setPage((p) => ({ ...p, sections: p.sections.filter((_, idx) => idx !== i) }));
  const moveSection = (i: number, dir: -1 | 1) =>
    setPage((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.sections.length) return p;
      const next = [...p.sections];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...p, sections: next };
    });

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/page/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setPage(j.page as PageContent);
      toast.success('Page updated — live now');
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
          <h1 className="text-2xl font-bold">{label}</h1>
          <p className="text-sm text-neutral-500 mt-1">Edit this page&apos;s content — it updates on the site instantly.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Page title</label>
          <input value={page.title} onChange={(e) => setField('title', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Intro (short paragraph under the title)</label>
          <textarea value={page.intro} onChange={(e) => setField('intro', e.target.value)} rows={2} className={areaCls} />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold mb-2">{isFaq ? 'Questions & answers' : 'Sections'}</p>
        <div className="space-y-3">
          {page.sections.map((s, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    value={s.heading}
                    onChange={(e) => setSection(i, 'heading', e.target.value)}
                    placeholder={isFaq ? 'Question' : 'Section heading'}
                    className={inputCls}
                  />
                  <textarea
                    value={s.body}
                    onChange={(e) => setSection(i, 'body', e.target.value)}
                    placeholder={isFaq ? 'Answer' : 'Section text'}
                    rows={3}
                    className={areaCls}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0} className="w-8 h-8 rounded-[5px] border border-neutral-200 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-50"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => moveSection(i, 1)} disabled={i === page.sections.length - 1} className="w-8 h-8 rounded-[5px] border border-neutral-200 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-50"><ArrowDown size={14} /></button>
                  <button type="button" onClick={() => removeSection(i)} className="w-8 h-8 rounded-[5px] border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addSection} className="mt-3 inline-flex items-center gap-2 rounded-[5px] border border-dashed border-neutral-300 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50">
          <Plus size={16} /> {isFaq ? 'Add question' : 'Add section'}
        </button>
      </div>

      <div className="mt-6">
        <InfoCard
          title={`How the ${label} page works`}
          intro="Whatever you type here is exactly what visitors see on the page."
          flow={['Edit title / intro', isFaq ? 'Add Q&A' : 'Add sections', 'Save', 'Live on the site']}
          steps={[
            { title: 'Title & intro', desc: 'The big heading and the short paragraph under it.' },
            { title: isFaq ? 'Questions' : 'Sections', desc: isFaq ? 'Each item is a question and its answer, shown as an expandable list.' : 'Each section has a heading and a paragraph. Reorder with the arrows.' },
            { title: 'Line breaks', desc: 'Press Enter inside the text box for new lines — they show on the page too.' },
            { title: 'Live', desc: 'Changes appear on the website as soon as you Save.' },
          ]}
          note="Leave a section empty and it is simply skipped on the page."
        />
      </div>
    </div>
  );
}
