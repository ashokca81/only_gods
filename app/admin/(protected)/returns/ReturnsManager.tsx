'use client';

import { useMemo, useState, useTransition } from 'react';
import { Check, X, RotateCcw, Trash2, Loader2, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/format';
import { setReturnStatus, deleteReturn } from './actions';
import InfoCard from '../../_components/InfoCard';

export interface ReturnRow {
  id: string;
  order_id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  order_total: number;
  reason: string;
  comment: string | null;
  status: string;
  refund_amount: number | null;
  created_at: string;
}

type Filter = 'requested' | 'all';
const statusStyle: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-600',
  approved: 'bg-blue-50 text-blue-600',
  rejected: 'bg-neutral-100 text-neutral-500',
  refunded: 'bg-emerald-50 text-emerald-600',
};

export default function ReturnsManager({ initialReturns }: { initialReturns: ReturnRow[] }) {
  const [rows, setRows] = useState<ReturnRow[]>(initialReturns);
  const [filter, setFilter] = useState<Filter>('requested');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const counts = useMemo(() => ({
    requested: rows.filter((r) => r.status === 'requested').length,
    all: rows.length,
  }), [rows]);

  const filtered = useMemo(
    () => (filter === 'requested' ? rows.filter((r) => r.status === 'requested') : rows),
    [rows, filter]
  );

  const act = (r: ReturnRow, status: string) => {
    let refund: number | null = null;
    if (status === 'refunded') {
      const input = prompt(`Refund amount for ${r.order_no}?`, String(r.order_total));
      if (input === null) return;
      refund = Math.max(0, Number(input) || 0);
    }
    setBusyId(r.id);
    startTransition(async () => {
      const res = await setReturnStatus(r.id, status, refund);
      setBusyId(null);
      if (res.ok) {
        setRows((p) => p.map((x) => (x.id === r.id ? { ...x, status, refund_amount: status === 'refunded' ? refund : x.refund_amount } : x)));
        toast.success(`Return ${status}`);
      } else toast.error(res.error);
    });
  };

  const remove = (r: ReturnRow) => {
    if (!confirm('Delete this return request?')) return;
    setBusyId(r.id);
    startTransition(async () => {
      const res = await deleteReturn(r.id);
      setBusyId(null);
      if (res.ok) { setRows((p) => p.filter((x) => x.id !== r.id)); toast.success('Deleted'); }
      else toast.error(res.error);
    });
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Returns</h1>
        <p className="text-sm text-neutral-500 mt-1">Customer return requests — review and refund.</p>
      </div>

      <div className="flex rounded-[5px] border border-neutral-200 overflow-hidden text-sm mb-5 w-fit">
        {(['requested', 'all'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 h-10 capitalize ${filter === f ? 'bg-black text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
            {filter === 'requested' ? 'No return requests to review. 🎉' : 'No returns yet.'}
          </div>
        ) : filtered.map((r) => (
          <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-semibold bg-neutral-100 rounded-[5px] px-2 py-0.5 text-sm">{r.order_no}</span>
                  <span className={`rounded-[5px] px-2 py-0.5 text-[11px] font-semibold capitalize ${statusStyle[r.status] ?? ''}`}>{r.status}</span>
                  {r.refund_amount != null && <span className="text-[11px] text-emerald-600 font-medium">Refunded {formatPrice(r.refund_amount)}</span>}
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">{r.customer_name} · +91 {r.customer_phone} · {new Date(r.created_at).toLocaleDateString('en-IN')} · Order {formatPrice(r.order_total)}</p>
                <p className="text-sm mt-2"><span className="font-medium">Reason:</span> {r.reason}</p>
                {r.comment && <p className="text-sm text-neutral-600">{r.comment}</p>}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                {busyId === r.id ? (
                  <Loader2 size={16} className="animate-spin text-neutral-400 m-2" />
                ) : (
                  <>
                    {r.status === 'requested' && (
                      <>
                        <button onClick={() => act(r, 'approved')} className="inline-flex items-center gap-1 rounded-[5px] bg-blue-600 text-white px-3 py-1.5 text-xs hover:bg-blue-700"><Check size={13} /> Approve</button>
                        <button onClick={() => act(r, 'rejected')} className="inline-flex items-center gap-1 rounded-[5px] border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-50"><X size={13} /> Reject</button>
                      </>
                    )}
                    {(r.status === 'approved' || r.status === 'requested') && (
                      <button onClick={() => act(r, 'refunded')} className="inline-flex items-center gap-1 rounded-[5px] bg-emerald-600 text-white px-3 py-1.5 text-xs hover:bg-emerald-700"><IndianRupee size={13} /> Mark refunded</button>
                    )}
                    {r.status === 'rejected' && (
                      <button onClick={() => act(r, 'requested')} className="inline-flex items-center gap-1 rounded-[5px] border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-50"><RotateCcw size={13} /> Reopen</button>
                    )}
                    <button onClick={() => remove(r)} className="inline-flex items-center gap-1 rounded-[5px] border border-red-200 text-red-500 px-3 py-1.5 text-xs hover:bg-red-50"><Trash2 size={13} /> Delete</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <InfoCard
        title="How Returns work"
        intro="Customers can ask to return a delivered order. You review each request and process the refund."
        flow={['Customer requests', 'You review', 'Approve or reject', 'Mark refunded']}
        steps={[
          { title: 'Requested', desc: 'A new return lands in the Requested tab with the customer’s reason.' },
          { title: 'Approve / Reject', desc: 'Approve genuine returns, reject the rest. The customer sees the status on their order.' },
          { title: 'Mark refunded', desc: 'After you send the money back, mark it refunded and record the amount.' },
          { title: 'Eligibility', desc: 'Only delivered orders can be returned — one request per order.' },
        ]}
        note="The status you set here shows instantly on the customer’s My Orders page."
      />
    </div>
  );
}
