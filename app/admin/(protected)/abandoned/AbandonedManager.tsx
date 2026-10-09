'use client';

import { useMemo, useState, useTransition } from 'react';
import { MessageCircle, Trash2, Loader2, ShoppingCart, IndianRupee, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/format';
import { deleteCart } from './actions';
import InfoCard from '../../_components/InfoCard';
import ExportMenu from '../../_components/ExportMenu';
import type { Row } from '@/lib/export';

export interface CartRow {
  customer_id: string;
  name: string | null;
  phone: string | null;
  items: { name: string; quantity: number }[];
  subtotal: number;
  updated_at: string;
}

const SITE = 'https://theonlygods.com';
const ageText = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function AbandonedManager({ initialRows }: { initialRows: CartRow[] }) {
  const [rows, setRows] = useState<CartRow[]>(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const totalValue = useMemo(() => rows.reduce((a, r) => a + r.subtotal, 0), [rows]);

  const whatsappLink = (r: CartRow) => {
    const phone = (r.phone ?? '').replace(/\D/g, '');
    const first = r.items[0]?.name ?? 'your items';
    const msg = `Hi ${r.name || 'there'}! 👋 You left ${first}${r.items.length > 1 ? ` + ${r.items.length - 1} more` : ''} in your ONLY GODS cart (${formatPrice(r.subtotal)}). Complete your order here 👉 ${SITE}/cart`;
    return `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
  };

  const remove = (r: CartRow) => {
    setBusyId(r.customer_id);
    startTransition(async () => {
      const res = await deleteCart(r.customer_id);
      setBusyId(null);
      if (res.ok) { setRows((p) => p.filter((x) => x.customer_id !== r.customer_id)); toast.success('Removed'); }
      else toast.error(res.error);
    });
  };

  const exportData = () => {
    const headers = ['Name', 'Phone', 'Items', 'Value', 'Left'];
    const data: Row[] = rows.map((r) => [
      r.name ?? '', r.phone ?? '', r.items.map((i) => `${i.name} x${i.quantity}`).join('; '), r.subtotal, ageText(r.updated_at),
    ]);
    return { headers, rows: data };
  };

  const card = 'rounded-2xl border border-neutral-200 bg-white p-4';

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold">Abandoned carts</h1>
          <p className="text-sm text-neutral-500 mt-1">Customers who added items but didn&apos;t order. Nudge them back.</p>
        </div>
        <ExportMenu filename="abandoned-carts" title="Abandoned carts" getData={exportData} disabled={rows.length === 0} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className={card}>
          <div className="flex items-center justify-between"><span className="text-sm text-neutral-500">Abandoned carts</span><ShoppingCart size={16} className="text-neutral-400" /></div>
          <div className="mt-2 text-2xl font-bold">{rows.length}</div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between"><span className="text-sm text-neutral-500">Potential revenue</span><IndianRupee size={16} className="text-neutral-400" /></div>
          <div className="mt-2 text-2xl font-bold">{formatPrice(totalValue)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden mb-6">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">No abandoned carts right now. 🎉</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-200">
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Items</th>
                  <th className="py-3 px-4 font-medium text-right">Value</th>
                  <th className="py-3 px-4 font-medium">Left</th>
                  <th className="py-3 px-4 font-medium text-right">Recover</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.customer_id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-3 px-4">
                      <p className="font-medium">{r.name || 'Unnamed'}</p>
                      <p className="text-[11px] text-neutral-400">+91 {r.phone ?? '—'}</p>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {r.items.slice(0, 2).map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                      {r.items.length > 2 ? ` +${r.items.length - 2} more` : ''}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatPrice(r.subtotal)}</td>
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap"><Clock size={12} className="inline mr-1 -mt-0.5" />{ageText(r.updated_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1.5">
                        {r.phone && (
                          <a href={whatsappLink(r)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-[5px] bg-emerald-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-700">
                            <MessageCircle size={13} /> WhatsApp
                          </a>
                        )}
                        <button onClick={() => remove(r)} disabled={busyId === r.customer_id} className="w-8 h-8 rounded-[5px] border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50">
                          {busyId === r.customer_id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
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
        title="How Abandoned Carts work"
        intro="When a logged-in customer fills their cart but doesn't check out, it shows up here so you can win the sale back."
        flow={['Customer leaves cart', 'It appears here', 'Tap WhatsApp', 'They complete the order']}
        steps={[
          { title: 'WhatsApp nudge', desc: 'Tap WhatsApp to open a ready-made reminder message to that customer — just hit send.' },
          { title: 'Potential revenue', desc: 'The total value sitting in abandoned carts — money you can still recover.' },
          { title: 'Export', desc: 'Download the list (name, phone, items) for a bulk WhatsApp/SMS campaign.' },
          { title: 'Auto-clears', desc: 'When the customer finally orders, their cart disappears from this list automatically.' },
        ]}
        note="Only logged-in customers' carts are tracked. Reach out within a few hours for the best results."
      />
    </div>
  );
}
