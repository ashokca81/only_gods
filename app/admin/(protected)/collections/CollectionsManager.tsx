'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, Save, Plus, Trash2, ArrowUp, ArrowDown, ImageIcon, ListChecks, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { inCollection, type Collection } from '@/lib/collections';
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

export interface AdminProduct {
  id: string;
  name: string;
  image: string | null;
  category: string | null;
  collections: string[] | null;
  is_active: boolean | null;
}

/** Pick products into one collection (hand-picked tags). Category members are shown locked. */
function ItemsModal({
  col,
  products,
  onClose,
  onSaved,
}: {
  col: Collection;
  products: AdminProduct[];
  onClose: () => void;
  onSaved: (ids: Set<string>) => void;
}) {
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(products.filter((p) => (p.collections ?? []).includes(col.title)).map((p) => p.id)),
  );
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);
  const viaCategory = (p: AdminProduct) => inCollection({ category: p.category }, col);
  const needle = q.trim().toLowerCase();
  const list = products.filter((p) => !needle || `${p.name} ${p.category ?? ''}`.toLowerCase().includes(needle));

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/collections/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: col.title, productIds: Array.from(picked) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      onSaved(picked);
      toast.success(`Items saved for “${col.title}”`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !saving && onClose()}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white text-neutral-900 rounded-xl border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div>
            <h3 className="font-semibold">Items in “{col.title}”</h3>
            <p className="text-xs text-neutral-500">Tick to add · untick to remove · {picked.size} picked</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[5px] hover:bg-neutral-100"><X size={18} /></button>
        </div>
        <div className="p-3 border-b border-neutral-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className={`${inputCls} pl-9`} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {list.length === 0 && <p className="text-sm text-neutral-500 p-4 text-center">No products found.</p>}
          {list.map((p) => {
            const auto = viaCategory(p);
            const on = auto || picked.has(p.id);
            return (
              <label key={p.id} className={`flex items-center gap-3 p-2 rounded-[5px] ${auto ? 'opacity-70' : 'cursor-pointer hover:bg-neutral-50'}`}>
                <input type="checkbox" checked={on} disabled={auto} onChange={() => toggle(p.id)} className="h-4 w-4 accent-black" />
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="w-10 h-12 rounded-[5px] object-cover bg-neutral-100" />
                ) : (
                  <div className="w-10 h-12 rounded-[5px] bg-neutral-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-neutral-500">
                    {p.category || '—'}
                    {auto && <span className="ml-2 text-emerald-600">· included via category</span>}
                    {p.is_active === false && <span className="ml-2 text-amber-600">· hidden from website</span>}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="p-3 border-t border-neutral-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-[5px] border border-neutral-200 text-sm">Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save items
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  col,
  count,
  categories,
  saved,
  isFirst,
  isLast,
  onChange,
  onMove,
  onDelete,
  onManage,
}: {
  col: Collection;
  count: number;
  categories: string[];
  saved: boolean;
  isFirst: boolean;
  isLast: boolean;
  onChange: (c: Collection) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onManage: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const doUpload = async (file: File) => {
    setBusy(true);
    try {
      const u = await uploadFile(file);
      onChange({ ...col, image: u });
      toast.success('Image uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const hasCat = (name: string) => col.categories.some((c) => c.toLowerCase() === name.toLowerCase());
  const toggleCat = (name: string) =>
    onChange({
      ...col,
      categories: hasCat(name)
        ? col.categories.filter((c) => c.toLowerCase() !== name.toLowerCase())
        : [...col.categories, name],
    });

  return (
    <div className="flex gap-3 items-start rounded-xl border border-neutral-200 p-3">
      <div className="w-24 h-28 shrink-0 rounded-[5px] overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center">
        {col.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={col.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={20} className="text-neutral-300" />
        )}
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2">
          <input
            value={col.title}
            onChange={(e) => onChange({ ...col, title: e.target.value })}
            placeholder="Collection title (e.g. Winter Season)"
            className={inputCls}
          />
          <span className="shrink-0 text-xs text-neutral-500 whitespace-nowrap">{count} items</span>
        </div>
        <div className="flex gap-2">
          <input
            value={col.image}
            onChange={(e) => onChange({ ...col, image: e.target.value })}
            placeholder="Cover image URL"
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

        <div>
          <span className="block text-xs text-neutral-500 mb-1">Categories — every product in these is included automatically</span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => toggleCat(name)}
                className={`px-2.5 py-1 rounded-[5px] text-xs border ${hasCat(name) ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'}`}
              >
                {hasCat(name) ? '✓ ' : ''}{name}
              </button>
            ))}
            {categories.length === 0 && <span className="text-xs text-neutral-400">No categories yet — add them under Categories.</span>}
          </div>
        </div>

        <button
          type="button"
          onClick={onManage}
          disabled={!saved}
          title={saved ? '' : 'Save changes first'}
          className="inline-flex items-center gap-1.5 rounded-[5px] border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
        >
          <ListChecks size={14} /> Manage items{saved ? '' : ' (save first)'}
        </button>
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

type Draft = Collection & { orig: string }; // orig = title as last saved ('' = new)

export default function CollectionsManager({
  initialCollections,
  categories,
  initialProducts,
}: {
  initialCollections: Collection[];
  categories: string[];
  initialProducts: AdminProduct[];
}) {
  const [cols, setCols] = useState<Draft[]>(initialCollections.map((c) => ({ ...c, orig: c.title })));
  const [savedTitles, setSavedTitles] = useState<string[]>(initialCollections.map((c) => c.title));
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [managing, setManaging] = useState<Collection | null>(null);
  const [saving, setSaving] = useState(false);

  // Count = products visible on the website (active), tagged or via a category.
  const countFor = (c: Collection) => products.filter((p) => p.is_active !== false && inCollection(p, c)).length;

  const update = (i: number, c: Collection) => setCols((prev) => prev.map((x, idx) => (idx === i ? { ...c, orig: x.orig } : x)));
  const move = (i: number, dir: -1 | 1) =>
    setCols((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (i: number) => setCols((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setCols((prev) => [...prev, { title: '', image: '', categories: [], orig: '' }]);

  const save = async () => {
    const clean = cols.filter((c) => c.title.trim() !== '');
    const renames = clean
      .filter((c) => c.orig && c.orig !== c.title.trim())
      .map((c) => ({ from: c.orig, to: c.title.trim() }));
    const kept = new Set(clean.map((c) => c.orig).filter(Boolean));
    const removed = savedTitles.filter((t) => !kept.has(t));
    if (removed.length && !confirm(`Delete ${removed.map((t) => `“${t}”`).join(', ')}? Products are only removed from the collection — the products themselves stay.`)) return;
    setSaving(true);
    try {
      const r = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collections: clean.map((c) => ({ title: c.title, image: c.image, categories: c.categories })),
          renames,
          removed,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      const next = j.collections as Collection[];
      setCols(next.map((c) => ({ ...c, orig: c.title })));
      setSavedTitles(next.map((c) => c.title));
      // Mirror the server-side tag rename/removal so the counts stay right.
      const map = new Map(renames.map((x) => [x.from, x.to]));
      setProducts((ps) =>
        ps.map((p) => ({
          ...p,
          collections: Array.from(new Set((p.collections ?? []).filter((t) => !removed.includes(t)).map((t) => map.get(t) ?? t))),
        })),
      );
      toast.success('Collections updated — live now');
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
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="text-sm text-neutral-500 mt-1">Season-wise groups (e.g. Winter Season). Pick categories or hand-pick products.</p>
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
        {cols.map((c, i) => (
          <Row
            key={i}
            col={c}
            count={countFor(c)}
            categories={categories}
            saved={!!c.orig && c.orig === c.title.trim() && savedTitles.includes(c.orig)}
            isFirst={i === 0}
            isLast={i === cols.length - 1}
            onChange={(nc) => update(i, nc)}
            onMove={(dir) => move(i, dir)}
            onDelete={() => remove(i)}
            onManage={() => setManaging(c)}
          />
        ))}
      </div>

      {cols.length === 0 && (
        <p className="text-sm text-neutral-500 rounded-xl border border-dashed border-neutral-200 p-6 text-center">No collections yet — add one below.</p>
      )}

      {managing && (
        <ItemsModal
          col={managing}
          products={products}
          onClose={() => setManaging(null)}
          onSaved={(ids) =>
            setProducts((ps) =>
              ps.map((p) => {
                const cur = p.collections ?? [];
                const has = cur.includes(managing.title);
                const should = ids.has(p.id);
                if (has === should) return p;
                return { ...p, collections: should ? [...cur, managing.title] : cur.filter((t) => t !== managing.title) };
              }),
            )
          }
        />
      )}

      <button
        onClick={add}
        className="mt-3 inline-flex items-center gap-2 rounded-[5px] border border-dashed border-neutral-300 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50"
      >
        <Plus size={16} /> Add collection
      </button>

      <div className="mt-6">
        <InfoCard
          title="How Collections work"
          intro="ఒక collection = “Winter Season” లాంటి group. Products రెండు విధాలుగా వస్తాయి: categories ఎంచుకుంటే ఆటోమేటిక్ గా, లేదా Manage items లో tick చేసి."
          flow={['Collection create చేయండి', 'Save', 'Categories / Manage items', 'Collections page లో కనిపిస్తుంది']}
          steps={[
            { title: 'Title & cover', desc: 'పేరు, cover image పెట్టండి — Collections page లో అదే card గా వస్తుంది.' },
            { title: 'Categories', desc: 'ఒకటి కంటే ఎక్కువ categories ఎంచుకోవచ్చు. ఆ categories లోని అన్ని products (తర్వాత add చేసేవి కూడా) ఆటోమేటిక్ గా వస్తాయి.' },
            { title: 'Manage items', desc: 'Save చేశాక “Manage items” నొక్కి products tick చేయండి — ఒకేసారి చాలా add / remove చేయవచ్చు.' },
            { title: 'Rename / delete', desc: 'పేరు మార్చితే products కూడా కొత్త పేరుకి మారతాయి. Delete చేస్తే products ఆ collection నుండి మాత్రమే తీసేయబడతాయి.' },
          ]}
          note="“items” = website లో కనిపించే products (categories నుండి + tick చేసినవి కలిపి)."
        />
      </div>
    </div>
  );
}
