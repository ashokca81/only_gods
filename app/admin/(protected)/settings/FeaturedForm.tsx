'use client';

import { useMemo, useState } from 'react';
import { Loader2, Save, Plus, X, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/format';
import { FEATURED_MAX } from '@/lib/featured';
import InfoCard from '../../_components/InfoCard';

export default function FeaturedForm({ initialIds, initialDesktop = true, initialMobile = true }: { initialIds: string[]; initialDesktop?: boolean; initialMobile?: boolean }) {
  const { data: products } = useProducts();
  const [ids, setIds] = useState<string[]>(initialIds);
  const [desktopEnabled, setDesktopEnabled] = useState(initialDesktop);
  const [mobileEnabled, setMobileEnabled] = useState(initialMobile);
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selected = ids.map((id) => byId.get(id)).filter((p): p is (typeof products)[number] => !!p);

  const available = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter((p) => !ids.includes(p.id)).filter((p) => !t || p.name.toLowerCase().includes(t)).slice(0, 40);
  }, [products, ids, q]);

  const add = (id: string) => {
    if (ids.length >= FEATURED_MAX) { toast.error(`You can pick up to ${FEATURED_MAX} products`); return; }
    setIds((p) => [...p, id]);
  };
  const remove = (id: string) => setIds((p) => p.filter((x) => x !== id));
  const move = (i: number, dir: -1 | 1) => setIds((prev) => { const j = i + dir; if (j < 0 || j >= prev.length) return prev; const n = [...prev]; [n[i], n[j]] = [n[j], n[i]]; return n; });

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/featured', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured: { ids, desktopEnabled, mobileEnabled } }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setIds(j.featured.ids as string[]);
      toast.success('Featured grid updated — live now');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mb-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Featured — What&apos;s Hot</h1>
          <p className="text-sm text-neutral-500 mt-1">The magazine grid below the carousel (up to {FEATURED_MAX}). Empty ⇒ falls back to trending products.</p>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200 p-4 mb-5 flex flex-wrap items-center gap-5">
        <span className="text-sm font-semibold">Show this grid on:</span>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={desktopEnabled} onChange={(e) => setDesktopEnabled(e.target.checked)} className="w-4 h-4" /> Desktop
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={mobileEnabled} onChange={(e) => setMobileEnabled(e.target.checked)} className="w-4 h-4" /> Mobile
        </label>
      </div>

      <div className="rounded-xl border border-neutral-200 p-4 mb-5">
        <p className="text-sm font-semibold mb-1">Selected ({selected.length}/{FEATURED_MAX})</p>
        <p className="text-xs text-neutral-500 mb-3">First product is the big hero tile; the rest fill the smaller tiles in order.</p>
        {selected.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing picked — the grid shows your trending-flagged products.</p>
        ) : (
          <div className="space-y-2">
            {selected.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-[5px] border border-neutral-200 p-2">
                <div className="w-12 h-12 shrink-0 rounded-[5px] overflow-hidden bg-neutral-100 border border-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images?.[0] || p.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}{i === 0 && <span className="ml-2 text-[10px] uppercase tracking-wider bg-black text-white rounded px-1.5 py-0.5">Hero</span>}</p>
                  <p className="text-xs text-neutral-500">{formatPrice(p.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="w-8 h-8 rounded-[5px] border border-neutral-200 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-50"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === selected.length - 1} className="w-8 h-8 rounded-[5px] border border-neutral-200 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-50"><ArrowDown size={14} /></button>
                  <button type="button" onClick={() => remove(p.id)} className="w-8 h-8 rounded-[5px] border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50"><X size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 p-4">
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products to add…" className="w-full h-11 pl-9 pr-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10" />
        </div>
        {available.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4 text-center">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {available.map((p) => (
              <button key={p.id} type="button" onClick={() => add(p.id)} disabled={ids.length >= FEATURED_MAX} className="flex items-center gap-3 rounded-[5px] border border-neutral-200 p-2 text-left hover:bg-neutral-50 disabled:opacity-40">
                <div className="w-10 h-10 shrink-0 rounded-[5px] overflow-hidden bg-neutral-100 border border-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images?.[0] || p.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-neutral-500">{formatPrice(p.price)}</p>
                </div>
                <Plus size={16} className="text-neutral-400 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <InfoCard
          title="How the Featured grid works"
          intro="The big “What’s Hot” magazine grid that appears below the carousel."
          flow={['Search a product', 'Add it', 'Order them', 'Save']}
          steps={[
            { title: 'Pick up to 5', desc: `The first is the large hero tile; the rest fill the smaller tiles (max ${FEATURED_MAX}).` },
            { title: 'Order', desc: 'Use the up/down arrows — the top one is the big hero tile.' },
            { title: 'Fallback', desc: 'If you pick nothing, the grid falls back to products flagged “trending”.' },
          ]}
          note="Only active products appear here and on the site."
        />
      </div>
    </div>
  );
}
