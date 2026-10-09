'use client';

import { useMemo, useState, useTransition } from 'react';
import { MessageCircle, Check, Trash2, Loader2, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { setNotified, deleteNotification } from './actions';
import InfoCard from '../../_components/InfoCard';
import ExportMenu from '../../_components/ExportMenu';
import type { Row } from '@/lib/export';

export interface WaitRow {
  id: string;
  product_id: string;
  product_name: string;
  product_stock: number;
  phone: string | null;
  name: string | null;
  notified: boolean;
  created_at: string;
}

const SITE = 'https://theonlygods.com';
type Filter = 'waiting' | 'all';

export default function WaitlistManager({ initialRows }: { initialRows: WaitRow[] }) {
  const [rows, setRows] = useState<WaitRow[]>(initialRows);
  const [filter, setFilter] = useState<Filter>('waiting');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const counts = useMemo(() => ({ waiting: rows.filter((r) => !r.notified).length, all: rows.length }), [rows]);
  const filtered = useMemo(() => (filter === 'waiting' ? rows.filter((r) => !r.notified) : rows), [rows, filter]);

  const waLink = (r: WaitRow) => {
    const phone = (r.phone ?? '').replace(/\D/g, '');
    const msg = `Hi ${r.name || 'there'}! 🎉 Good news — ${r.product_name} is back in stock at ONLY GODS. Grab it here 👉 ${SITE}/product/${r.product_id}`;
    return `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
  };

  const mark = (r: WaitRow) => {
    setBusyId(r.id);
    startTransition(async () => {
      const res = await setNotified(r.id, true);
      setBusyId(null);
      if (res.ok) { setRows((p) => p.map((x) => (x.id === r.id ? { ...x, notified: true } : x))); toast.success('Marked as notified'); }
      else toast.error(res.error);
    });
  };

  const remove = (r: WaitRow) => {
    setBusyId(r.id);
    startTransition(async () => {
      const res = await deleteNotification(r.id);
      setBusyId(null);
      if (res.ok) { setRows((p) => p.filter((x) => x.id !== r.id)); toast.success('Removed'); }
      else toast.error(res.error);
    });
  };

  const exportData = () => {
    const headers = ['Product', 'In stock?', 'Customer', 'Phone', 'Requested', 'Notified'];
    const data: Row[] = filtered.map((r) => [
      r.product_name, r.product_stock > 0 ? 'Yes' : 'No', r.name ?? '', r.phone ?? '',
      new Date(r.created_at).toLocaleDateString('en-IN'), r.notified ? 'Yes' : 'No',
    ]);
    return { headers, rows: data };
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold">Back-in-stock waitlist</h1>
          <p className="text-sm text-neutral-500 mt-1">Customers waiting for sold-out products. Nudge them when you restock.</p>
        </div>
        <ExportMenu filename="waitlist" title="Waitlist" getData={exportData} disabled={filtered.length === 0} />
      </div>

      <div className="flex rounded-[5px] border border-neutral-200 overflow-hidden text-sm mb-5 w-fit">
        {(['waiting', 'all'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 h-10 capitalize ${filter === f ? 'bg-black text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden mb-6">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">No one waiting right now.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-200">
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium text-center">Stock</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-3 px-4">
                      <p className="font-medium">{r.product_name}</p>
                      <p className="text-[11px] text-neutral-400">{new Date(r.created_at).toLocaleDateString('en-IN')}{r.notified ? ' · notified' : ''}</p>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{r.name || 'Customer'} · +91 {r.phone ?? '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`rounded-[5px] px-2 py-1 text-[11px] font-semibold ${r.product_stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {r.product_stock > 0 ? `In stock · ${r.product_stock}` : 'Out'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1.5">
                        {r.phone && r.product_stock > 0 && (
                          <a href={waLink(r)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-[5px] bg-emerald-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-700" title="WhatsApp — back in stock">
                            <MessageCircle size={13} /> Notify
                          </a>
                        )}
                        {!r.notified && (
                          <button onClick={() => mark(r)} disabled={busyId === r.id} className="w-8 h-8 rounded-[5px] border border-neutral-200 flex items-center justify-center hover:bg-neutral-50" title="Mark notified">
                            {busyId === r.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          </button>
                        )}
                        <button onClick={() => remove(r)} disabled={busyId === r.id} className="w-8 h-8 rounded-[5px] border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InfoCard
        title="How the waitlist works"
        intro="When a product is sold out, customers tap “Notify me” to join this list."
        flow={['Customer taps Notify', 'They wait here', 'You restock', 'WhatsApp them']}
        steps={[
          { title: 'Who is waiting', desc: 'See each customer, their phone, and the product they want — grouped by product.' },
          { title: 'Restock first', desc: 'When a product shows “In stock” again, the green WhatsApp button appears.' },
          { title: 'Notify', desc: 'Tap WhatsApp to send a ready-made “back in stock” message, then mark them notified.' },
          { title: 'Export', desc: 'Download the list for a bulk WhatsApp/SMS blast.' },
        ]}
        note="Notifications are manual — no messages go out until you send them."
      />
    </div>
  );
}
