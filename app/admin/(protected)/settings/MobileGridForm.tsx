'use client';

import { useMemo, useState } from 'react';
import { Loader2, Save, Plus, X, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/format';
import { MOBILE_GRID_MAX } from '@/lib/mobileGrid';
import InfoCard from '../../_components/InfoCard';

export default function MobileGridForm({ initialIds }: { initialIds: string[] }) {
  const { data: products } = useProducts();
  const [ids, setIds] = useState<string[]>(initialIds);
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selected = ids.map((id) => byId.get(id)).filter((p): p is (typeof products)[number] => !!p);

  const available = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter((p) => !ids.includes(p.id)).filter((p) => !t || p.name.toLowerCase().includes(t)).slice(0, 40);
  }, [products, ids, q]);

  const add = (id: string) => {
    if (ids.length >= MOBILE_GRID_MAX) { toast.error(`You can pick up to ${MOBILE_GRID_MAX} products`); return; }
    setIds((p) => [...p, id]);
  };
  const remove = (id: string) => setIds((p) => p.filter((x) => x !== id));
  const move = (i: number, dir: -1 | 1) => setIds((prev) => { const j = i + dir; if (j < 0 || j >= prev.length) return prev; const n = [...prev]; [n[i], n[j]] = [n[j], n[i]]; return n; });

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/mobile-grid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobileGrid: { ids } }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setIds(j.mobileGrid.ids as string[]);
      toast.success('Mobile grid updated — live now');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mb-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mobile grid</h1>
          <p className="text-sm text-neutral-500 mt-1">A 2×2 product grid shown above the carousel — mobile only (up to {MOBILE_GRID_MAX}).</p>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200 p-4 mb-5">
        <p className="text-sm font-semibold mb-1">Selected ({selected.length}/{MOBILE_GRID_MAX})</p>
        <p className="text-xs text-neutral-500 mb-3">Top to bottom here fills the grid left-to-right, top row first. Empty ⇒ the grid is hidden.</p>
        {selected.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing picked — the mobile grid is hidden.</p>
        ) : (
          <div className="space-y-2">
            {selected.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-[5px] border border-neutral-200 p-2">
                <div className="w-12 h-12 shrink-0 rounded-[5px] overflow-hidden bg-neutral-100 border border-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images?.[0] || p.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
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
              <button key={p.id} type="button" onClick={() => add(p.id)} disabled={ids.length >= MOBILE_GRID_MAX} className="flex items-center gap-3 rounded-[5px] border border-neutral-200 p-2 text-left hover:bg-neutral-50 disabled:opacity-40">
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
          title="How the mobile grid works"
          intro="A small 2×2 product grid that appears only on phones, just above the carousel."
          flow={['Search a product', 'Add it', 'Order them', 'Save']}
          steps={[
            { title: 'Mobile only', desc: 'This grid shows on phones; it is hidden on desktop.' },
            { title: 'Pick up to 4', desc: `Add the products to feature (max ${MOBILE_GRID_MAX} = 2 rows of 2).` },
            { title: 'Order', desc: 'Use the up/down arrows — top is first (top-left of the grid).' },
            { title: 'Hide it', desc: 'Remove everything to hide the grid entirely.' },
          ]}
          note="Only active products appear here and on the site."
        />
      </div>
    </div>
  );
}
