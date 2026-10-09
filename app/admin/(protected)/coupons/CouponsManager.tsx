'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Ticket, Power } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/format';
import { saveCoupon, deleteCoupon, toggleCouponActive, type CouponInput } from './actions';
import InfoCard from '../../_components/InfoCard';
import ExportMenu from '../../_components/ExportMenu';
import type { Row } from '@/lib/export';

export interface CouponRow {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  min_order: number;
  max_discount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  per_customer_limit: number | null;
  is_active: boolean;
  created_at: string;
}

const inp = 'w-full h-11 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10';
const toLocal = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const blank: CouponInput = {
  code: '', type: 'percent', value: 10, min_order: 0, max_discount: null,
  starts_at: null, expires_at: null, usage_limit: null, per_customer_limit: null, is_active: true,
};

export default function CouponsManager({ initialCoupons }: { initialCoupons: CouponRow[] }) {
  const [coupons, setCoupons] = useState<CouponRow[]>(initialCoupons);
  const [editing, setEditing] = useState<CouponInput | null>(null);
  const [saving, startSave] = useTransition();

  const openNew = () => setEditing({ ...blank });
  const openEdit = (c: CouponRow) =>
    setEditing({
      id: c.id, code: c.code, type: c.type, value: Number(c.value), min_order: Number(c.min_order),
      max_discount: c.max_discount != null ? Number(c.max_discount) : null,
      starts_at: c.starts_at, expires_at: c.expires_at,
      usage_limit: c.usage_limit, per_customer_limit: c.per_customer_limit, is_active: c.is_active,
    });

  const save = () => {
    if (!editing) return;
    startSave(async () => {
      const res = await saveCoupon(editing);
      if (res.ok) {
        toast.success('Coupon saved');
        setEditing(null);
        window.location.reload();
      } else toast.error(res.error);
    });
  };

  const remove = (c: CouponRow) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    startSave(async () => {
      const res = await deleteCoupon(c.id);
      if (res.ok) { setCoupons((p) => p.filter((x) => x.id !== c.id)); toast.success('Deleted'); }
      else toast.error(res.error);
    });
  };

  const toggle = (c: CouponRow) => {
    startSave(async () => {
      const res = await toggleCouponActive(c.id, !c.is_active);
      if (res.ok) setCoupons((p) => p.map((x) => (x.id === c.id ? { ...x, is_active: !c.is_active } : x)));
      else toast.error(res.error);
    });
  };

  const discountLabel = (c: CouponRow) => (c.type === 'percent' ? `${c.value}% off` : `${formatPrice(c.value)} off`);

  const exportData = () => {
    const headers = ['Code', 'Discount', 'Min order', 'Used', 'Limit', 'Expires', 'Active'];
    const rows: Row[] = coupons.map((c) => [
      c.code, discountLabel(c), c.min_order, c.used_count, c.usage_limit ?? '∞', fmtDate(c.expires_at), c.is_active ? 'Yes' : 'No',
    ]);
    return { headers, rows };
  };

  const upd = <K extends keyof CouponInput>(k: K, v: CouponInput[K]) => setEditing((e) => (e ? { ...e, [k]: v } : e));
  const numOrNull = (s: string) => (s.trim() === '' ? null : Math.max(0, Number(s) || 0));

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-sm text-neutral-500 mt-1">Discount codes customers apply at checkout.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu filename="coupons" title="Coupons" getData={exportData} disabled={coupons.length === 0} />
          <button onClick={openNew} className="inline-flex items-center gap-2 rounded-[5px] bg-blue-600 text-white px-5 h-11 text-sm font-semibold hover:bg-blue-700">
            <Plus size={18} /> New coupon
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden mb-6">
        {coupons.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">No coupons yet. Create your first discount code.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-200">
                  <th className="py-3 px-4 font-medium">Code</th>
                  <th className="py-3 px-4 font-medium">Discount</th>
                  <th className="py-3 px-4 font-medium text-right">Min order</th>
                  <th className="py-3 px-4 font-medium text-center">Used</th>
                  <th className="py-3 px-4 font-medium">Expires</th>
                  <th className="py-3 px-4 font-medium text-center">Active</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-3 px-4"><span className="font-mono font-semibold bg-neutral-100 rounded-[5px] px-2 py-1">{c.code}</span></td>
                    <td className="py-3 px-4">
                      {discountLabel(c)}
                      {c.type === 'percent' && c.max_discount != null && <span className="text-[11px] text-neutral-400"> (max {formatPrice(c.max_discount)})</span>}
                    </td>
                    <td className="py-3 px-4 text-right">{c.min_order > 0 ? formatPrice(c.min_order) : '—'}</td>
                    <td className="py-3 px-4 text-center">{c.used_count}{c.usage_limit != null ? ` / ${c.usage_limit}` : ''}</td>
                    <td className="py-3 px-4">{fmtDate(c.expires_at)}</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => toggle(c)} title="Toggle active" className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[11px] font-semibold ${c.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>
                        <Power size={12} /> {c.is_active ? 'On' : 'Off'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-[5px] border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"><Pencil size={14} /></button>
                        <button onClick={() => remove(c)} className="w-8 h-8 rounded-[5px] border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50"><Trash2 size={14} /></button>
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
        title="How Coupons work"
        intro="Create discount codes and share them. Customers type the code at checkout to get the discount."
        flow={['Create a code', 'Share it', 'Customer applies', 'Discount at checkout']}
        steps={[
          { title: 'Percent or Flat', desc: 'e.g. 10% off, or ₹200 off. For percent you can cap the max discount.' },
          { title: 'Rules', desc: 'Set a minimum order, an expiry date, a total usage limit and a per-customer limit.' },
          { title: 'Safe', desc: 'The discount is calculated on the server — customers cannot fake it.' },
          { title: 'On / Off', desc: 'Toggle a coupon off anytime without deleting it.' },
        ]}
        note="Usage count updates automatically every time a coupon is used on a paid order."
      />

      {/* Create / edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !saving && setEditing(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 h-14 flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2"><Ticket size={16} /> {editing.id ? 'Edit coupon' : 'New coupon'}</h2>
              <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block">
                <span className="text-sm text-neutral-600">Code</span>
                <input className={`${inp} mt-1 font-mono uppercase`} value={editing.code} onChange={(e) => upd('code', e.target.value.toUpperCase())} placeholder="FIRST10" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-neutral-600">Type</span>
                  <select className={`${inp} mt-1`} value={editing.type} onChange={(e) => upd('type', e.target.value as 'percent' | 'flat')}>
                    <option value="percent">Percent (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm text-neutral-600">{editing.type === 'percent' ? 'Percent off' : 'Amount off (₹)'}</span>
                  <input className={`${inp} mt-1`} type="number" min={0} value={editing.value} onChange={(e) => upd('value', Math.max(0, Number(e.target.value) || 0))} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-neutral-600">Minimum order (₹)</span>
                  <input className={`${inp} mt-1`} type="number" min={0} value={editing.min_order} onChange={(e) => upd('min_order', Math.max(0, Number(e.target.value) || 0))} />
                </label>
                {editing.type === 'percent' && (
                  <label className="block">
                    <span className="text-sm text-neutral-600">Max discount (₹, optional)</span>
                    <input className={`${inp} mt-1`} type="number" min={0} value={editing.max_discount ?? ''} onChange={(e) => upd('max_discount', numOrNull(e.target.value))} placeholder="No cap" />
                  </label>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-neutral-600">Total usage limit</span>
                  <input className={`${inp} mt-1`} type="number" min={0} value={editing.usage_limit ?? ''} onChange={(e) => upd('usage_limit', numOrNull(e.target.value))} placeholder="Unlimited" />
                </label>
                <label className="block">
                  <span className="text-sm text-neutral-600">Per-customer limit</span>
                  <input className={`${inp} mt-1`} type="number" min={0} value={editing.per_customer_limit ?? ''} onChange={(e) => upd('per_customer_limit', numOrNull(e.target.value))} placeholder="Unlimited" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-neutral-600">Starts (optional)</span>
                  <input className={`${inp} mt-1`} type="datetime-local" value={toLocal(editing.starts_at)} onChange={(e) => upd('starts_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                </label>
                <label className="block">
                  <span className="text-sm text-neutral-600">Expires (optional)</span>
                  <input className={`${inp} mt-1`} type="datetime-local" value={toLocal(editing.expires_at)} onChange={(e) => upd('expires_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                </label>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editing.is_active} onChange={(e) => upd('is_active', e.target.checked)} className="w-4 h-4" />
                <span className="text-sm">Active</span>
              </label>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-5 py-3 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-[5px] border border-neutral-200 px-4 py-2 text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="rounded-[5px] bg-black text-white px-5 py-2 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 size={15} className="animate-spin" /> : null} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
