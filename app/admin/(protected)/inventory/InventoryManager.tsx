'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Search, Minus, Plus, Check, Loader2, History, X, AlertTriangle, PackageX, Boxes, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { setStock, adjustStock, getStockHistory, type Movement } from './actions';
import InfoCard from '../../_components/InfoCard';
import ExportMenu from '../../_components/ExportMenu';
import type { Row } from '@/lib/export';

export interface InventoryRow {
  id: string;
  name: string;
  category: string | null;
  image: string | null;
  stock: number;
  reorder_level: number;
  is_active: boolean;
  hasVariants: boolean;
}

type Filter = 'all' | 'low' | 'out';

const statusOf = (r: InventoryRow) => (r.stock <= 0 ? 'out' : r.stock <= r.reorder_level ? 'low' : 'in');

function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function InventoryManager({ initialRows }: { initialRows: InventoryRow[] }) {
  const [rows, setRows] = useState<InventoryRow[]>(initialRows);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // History drawer
  const [historyFor, setHistoryFor] = useState<InventoryRow | null>(null);
  const [history, setHistory] = useState<Movement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const counts = useMemo(() => {
    let low = 0, out = 0;
    for (const r of rows) {
      const s = statusOf(r);
      if (s === 'out') out++;
      else if (s === 'low') low++;
    }
    return { low, out, total: rows.length };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !(r.category ?? '').toLowerCase().includes(q)) return false;
      const s = statusOf(r);
      if (filter === 'low') return s === 'low';
      if (filter === 'out') return s === 'out';
      return true;
    });
  }, [rows, query, filter]);

  const applyStock = (r: InventoryRow, newStock: number) => {
    setSavingId(r.id);
    startTransition(async () => {
      const res = await setStock(r.id, newStock, 'manual');
      setSavingId(null);
      if (res.ok) {
        setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, stock: res.newStock } : x)));
        setDraft((d) => { const n = { ...d }; delete n[r.id]; return n; });
        toast.success(`${r.name}: stock set to ${res.newStock}`);
      } else {
        toast.error(res.error);
      }
    });
  };

  const quickAdjust = (r: InventoryRow, delta: number) => {
    setSavingId(r.id);
    startTransition(async () => {
      const res = await adjustStock(r.id, delta, 'manual');
      setSavingId(null);
      if (res.ok) {
        setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, stock: res.newStock } : x)));
        toast.success(`${r.name}: ${res.newStock} in stock`);
      } else toast.error(res.error);
    });
  };

  const openHistory = async (r: InventoryRow) => {
    setHistoryFor(r);
    setLoadingHistory(true);
    try {
      setHistory(await getStockHistory(r.id));
    } finally {
      setLoadingHistory(false);
    }
  };

  const exportData = () => {
    const headers = ['Product', 'Category', 'Stock', 'Reorder level', 'Status'];
    const data: Row[] = filtered.map((r) => {
      const s = statusOf(r);
      return [r.name, r.category ?? '', r.stock, r.reorder_level, s === 'out' ? 'Out of stock' : s === 'low' ? 'Low' : 'In stock'];
    });
    return { headers, rows: data };
  };

  const stat = (label: string, value: number, cls: string, Icon: typeof Boxes) => (
    <button
      onClick={() => setFilter(label === 'Low stock' ? 'low' : label === 'Out of stock' ? 'out' : 'all')}
      className="rounded-2xl border border-neutral-200 bg-white p-4 text-left hover:border-neutral-300"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">{label}</span>
        <Icon size={16} className={cls} />
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </button>
  );

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-neutral-500 mt-1">Track and update stock. Low & out-of-stock at a glance.</p>
        </div>
        <ExportMenu filename="inventory" title="Inventory" getData={exportData} disabled={filtered.length === 0} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {stat('All products', counts.total, 'text-neutral-400', Boxes)}
        {stat('Low stock', counts.low, 'text-amber-500', AlertTriangle)}
        {stat('Out of stock', counts.out, 'text-red-500', PackageX)}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product or category…" className="w-full h-11 pl-9 pr-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10" />
        </div>
        <div className="flex rounded-[5px] border border-neutral-200 overflow-hidden text-sm">
          {(['all', 'low', 'out'] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 h-11 ${filter === f ? 'bg-black text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}>
              {f === 'all' ? 'All' : f === 'low' ? 'Low' : 'Out'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden mb-6">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">No products match.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-200">
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-center">Reorder ≤</th>
                  <th className="py-3 px-4 font-medium">Adjust stock</th>
                  <th className="py-3 px-4 font-medium text-right">History</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const s = statusOf(r);
                  const busy = savingId === r.id;
                  const d = draft[r.id];
                  return (
                    <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {r.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.image} alt="" className="w-10 h-10 rounded-[5px] object-cover bg-neutral-100" />
                          ) : <div className="w-10 h-10 rounded-[5px] bg-neutral-100" />}
                          <div>
                            <p className="font-medium">{r.name}</p>
                            <p className="text-[11px] text-neutral-400">{r.category || '—'}{!r.is_active && ' · Hidden'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[11px] font-semibold ${s === 'out' ? 'bg-red-50 text-red-600' : s === 'low' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {s === 'out' ? 'Out' : s === 'low' ? `Low · ${r.stock}` : `In · ${r.stock}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-neutral-500">{r.reorder_level}</td>
                      <td className="py-3 px-4">
                        {r.hasVariants ? (
                          <Link href={`/admin/products/${r.id}/edit`} className="inline-flex items-center gap-1 text-[12px] text-blue-600 hover:underline">
                            Edit sizes <ExternalLink size={12} />
                          </Link>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => quickAdjust(r, -1)} disabled={busy || r.stock <= 0} className="w-8 h-8 rounded-[5px] border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-40"><Minus size={14} /></button>
                            <input
                              value={d ?? String(r.stock)}
                              onChange={(e) => setDraft((prev) => ({ ...prev, [r.id]: e.target.value.replace(/[^\d]/g, '') }))}
                              className="w-16 h-8 text-center rounded-[5px] border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                            />
                            <button onClick={() => quickAdjust(r, 1)} disabled={busy} className="w-8 h-8 rounded-[5px] border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-40"><Plus size={14} /></button>
                            {d !== undefined && d !== String(r.stock) && (
                              <button onClick={() => applyStock(r, Number(d) || 0)} disabled={busy} className="h-8 px-2 rounded-[5px] bg-black text-white flex items-center gap-1 text-xs disabled:opacity-50">
                                {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Set
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => openHistory(r)} title="Stock history" className="inline-flex items-center justify-center w-8 h-8 rounded-[5px] border border-neutral-200 hover:bg-neutral-50">
                          <History size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InfoCard
        title="How Inventory works"
        intro="Keep stock accurate so you never oversell and always know what to reorder."
        flow={['Check status', 'Adjust stock', 'It is logged', 'Reorder low items']}
        steps={[
          { title: 'Status colours', desc: 'Green = in stock, Amber = at/below reorder level, Red = out. Tap a card above to filter.' },
          { title: 'Quick adjust', desc: 'Use − / + or type a number and press Set. Every change is saved to the stock history.' },
          { title: 'Reorder level', desc: 'Set per product (in the product form). When stock drops to it, the item shows as Low.' },
          { title: 'Products with sizes', desc: 'Colour/size products show “Edit sizes” — change each size’s stock inside the product.' },
        ]}
        note="Overselling protection (auto-reduce on each order) comes in the next step."
      />

      {/* History drawer */}
      {historyFor && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setHistoryFor(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full max-w-sm h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 h-16 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm">Stock history</h2>
                <p className="text-[11px] text-neutral-500 truncate max-w-[220px]">{historyFor.name}</p>
              </div>
              <button onClick={() => setHistoryFor(null)} className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="p-4">
              {loadingHistory ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-neutral-400" /></div>
              ) : history.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-10">No changes recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                      <div>
                        <span className={`font-semibold ${m.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{m.change >= 0 ? `+${m.change}` : m.change}</span>
                        <span className="text-neutral-400"> → {m.new_stock} left</span>
                        <p className="text-[11px] text-neutral-400 capitalize">{m.reason}{m.note ? ` · ${m.note}` : ''}</p>
                      </div>
                      <span className="text-[11px] text-neutral-400 whitespace-nowrap">{fmtDate(m.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
