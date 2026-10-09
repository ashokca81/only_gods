'use client';

import { useState, useTransition, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown, ChevronUp, ShoppingCart, IndianRupee, Clock, Printer, FileText, ExternalLink,
  Search, RotateCcw, LayoutGrid, CheckCircle2, Truck, Package, XCircle,
  ArrowUpDown, Calendar, Wallet, SlidersHorizontal, Filter, Loader2,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { updateOrderStatus, updateShipping } from './actions';
import { toast } from 'sonner';
import { ORDER_STATUSES, type OrderStatus } from './constants';
import ExportMenu from '../../_components/ExportMenu';
import type { Row } from '@/lib/export';
import InfoCard from '../../_components/InfoCard';

export interface OrderItemRow {
  id: string;
  product_id: string | null;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
  cost: number | null;
}

export interface OrderRow {
  id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address_line: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  payment_method: string;
  payment_status: string | null;
  courier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number | null;
  coupon_code: string | null;
  total: number;
  created_at: string;
  order_items: OrderItemRow[];
}

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  shipped: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-neutral-100 text-neutral-500',
};

// Colour + icon per status for the filter chips (mockup style).
const STATUS_META: Record<
  OrderStatus,
  { label: string; icon: typeof Clock; tint: string; badge: string; ring: string }
> = {
  pending: { label: 'Pending', icon: Clock, tint: 'bg-amber-50 text-amber-600', badge: 'bg-amber-100 text-amber-700', ring: 'ring-amber-400' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, tint: 'bg-sky-50 text-sky-600', badge: 'bg-sky-100 text-sky-700', ring: 'ring-sky-400' },
  shipped: { label: 'Shipped', icon: Truck, tint: 'bg-violet-50 text-violet-600', badge: 'bg-violet-100 text-violet-700', ring: 'ring-violet-400' },
  delivered: { label: 'Delivered', icon: Package, tint: 'bg-emerald-50 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-400' },
  cancelled: { label: 'Cancelled', icon: XCircle, tint: 'bg-rose-50 text-rose-600', badge: 'bg-rose-100 text-rose-700', ring: 'ring-rose-400' },
};

export default function OrdersManager({
  initialOrders,
}: {
  initialOrders: OrderRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<string | null>(null);

  // ---------------- advanced filters ----------------
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cod' | 'prepaid'>('all');
  const [range, setRange] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [minTotal, setMinTotal] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'high' | 'low'>('newest');
  const [moreOpen, setMoreOpen] = useState(false);

  const todayStr = () => new Date().toISOString().slice(0, 10);
  const daysAgoStr = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const applyRange = (r: 'all' | 'today' | '7d' | '30d') => {
    setRange(r);
    if (r === 'all') { setFromDate(''); setToDate(''); }
    else if (r === 'today') { setFromDate(todayStr()); setToDate(todayStr()); }
    else if (r === '7d') { setFromDate(daysAgoStr(6)); setToDate(todayStr()); }
    else if (r === '30d') { setFromDate(daysAgoStr(29)); setToDate(todayStr()); }
  };
  const clearAll = () => {
    setQuery(''); setStatusFilter('all'); setPaymentFilter('all');
    setRange('all'); setFromDate(''); setToDate('');
    setMinTotal(''); setMaxTotal(''); setSortBy('newest');
  };
  const filtersActive = Boolean(
    query || statusFilter !== 'all' || paymentFilter !== 'all' ||
    fromDate || toDate || minTotal || maxTotal
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = initialOrders.filter((o) => {
      if (q && !(
        o.order_no.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.toLowerCase().includes(q)
      )) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && (o.payment_method || 'cod').toLowerCase() !== paymentFilter) return false;
      const t = new Date(o.created_at).getTime();
      if (fromDate && t < new Date(fromDate + 'T00:00:00').getTime()) return false;
      if (toDate && t > new Date(toDate + 'T23:59:59').getTime()) return false;
      if (minTotal && Number(o.total) < Number(minTotal)) return false;
      if (maxTotal && Number(o.total) > Number(maxTotal)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'high') return Number(b.total) - Number(a.total);
      return Number(a.total) - Number(b.total);
    });
  }, [initialOrders, query, statusFilter, paymentFilter, fromDate, toDate, minTotal, maxTotal, sortBy]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: initialOrders.length };
    ORDER_STATUSES.forEach((s) => (c[s] = 0));
    initialOrders.forEach((o) => { c[o.status] = (c[o.status] ?? 0) + 1; });
    return c;
  }, [initialOrders]);

  const totalOrders = initialOrders.length;
  const pendingCount = initialOrders.filter((o) => o.status === 'pending').length;
  const revenue = initialOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((a, o) => a + Number(o.total), 0);

  const stats = [
    { label: 'Total orders', value: String(totalOrders), icon: ShoppingCart },
    { label: 'Pending', value: String(pendingCount), icon: Clock },
    { label: 'Revenue', value: formatPrice(revenue), icon: IndianRupee },
  ];

  const changeStatus = (id: string, status: OrderStatus) => {
    startTransition(async () => {
      const res = await updateOrderStatus(id, status);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  };

  const exportOrders = () => {
    const headers = ['Order No', 'Date', 'Customer', 'Phone', 'Email', 'Status', 'Payment', 'Items', 'Subtotal', 'Coupon', 'Discount', 'Shipping', 'Total', 'City', 'State', 'Pincode'];
    const rows: Row[] = filtered.map((o) => [
      o.order_no,
      new Date(o.created_at).toLocaleDateString('en-IN'),
      o.customer_name,
      o.customer_phone,
      o.customer_email ?? '',
      o.status,
      o.payment_method || 'cod',
      o.order_items.reduce((a, i) => a + (i.quantity || 0), 0),
      Number(o.subtotal) || 0,
      o.coupon_code ?? '',
      Number(o.discount) || 0,
      Number(o.shipping) || 0,
      Number(o.total) || 0,
      o.city ?? '',
      o.state ?? '',
      o.pincode ?? '',
    ]);
    return { headers, rows };
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold mb-1">Orders</h1>
          <p className="text-sm text-neutral-500">Customer orders from the website.</p>
        </div>
        <ExportMenu filename="orders" title="Orders" getData={exportOrders} disabled={filtered.length === 0} />
      </div>

      <InfoCard
        title="How the Orders page works"
        intro="Every order a customer places on your website appears here."
        flow={['New order', 'Pending', 'Confirmed', 'Shipped', 'Delivered']}
        steps={[
          { title: 'Find orders', desc: 'Search by order no / customer / phone, or open “More Filters” for status, date & amount.' },
          { title: 'See details', desc: 'Click a row to expand the items, customer address and totals.' },
          { title: 'Update status', desc: 'Use the status dropdown to move an order along: Pending → Confirmed → Shipped → Delivered.' },
          { title: 'Print label', desc: 'Use 🖨 to print a 4×6 shipping label with QR code, address and the COD amount.' },
        ]}
        note="COD orders: collect the “Total” amount in cash when the parcel is delivered."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">{label}</span>
              <Icon size={18} className="text-neutral-400" />
            </div>
            <div className="mt-3 text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* ---------------- Advanced filter bar ---------------- */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 mb-4 shadow-sm">

        {/* Row 1: search (fills width) + sort + clear + more filters — all same height */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center bg-neutral-100 rounded-[5px] flex-1 min-w-[240px] h-11">
            <Search size={18} className="absolute left-3 text-neutral-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Order ID, Customer Name, Phone or Email…"
              className="w-full h-full bg-transparent rounded-[5px] pl-10 pr-28 text-sm leading-none placeholder:text-neutral-400 focus:outline-none"
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 inline-flex items-center rounded-[5px] bg-blue-600 text-white text-sm font-semibold leading-none px-4 hover:bg-blue-700">
              Search
            </button>
          </div>

          <div className="relative">
            <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none rounded-[5px] border border-neutral-200 bg-white pl-9 pr-8 h-11 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="high">High → Low</option>
              <option value="low">Low → High</option>
            </select>
            <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>

          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-[5px] bg-rose-50 text-rose-600 px-4 h-11 text-sm font-semibold leading-none hover:bg-rose-100"
          >
            <RotateCcw size={15} /> Clear All
          </button>

          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={`inline-flex items-center gap-2 rounded-[5px] border px-4 h-11 text-sm font-semibold leading-none transition-colors ${
              moreOpen ? 'border-slate-900 bg-slate-900 text-white' : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <SlidersHorizontal size={16} /> More Filters
            <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsible advanced filters (closed by default) */}
        {moreOpen && (
          <div className="space-y-4 border-t border-neutral-100 mt-4 pt-4">

            {/* Order Status chips */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-700 mr-1">
                <Filter size={16} className="text-neutral-400" /> Order Status
              </span>

              <button
                onClick={() => setStatusFilter('all')}
                className={`inline-flex items-center gap-2 rounded-[5px] pl-3 pr-2 py-2 text-sm font-semibold leading-none transition ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <LayoutGrid size={16} /> All
                <span className={`rounded-[5px] px-2 py-1 text-xs font-bold leading-none ${statusFilter === 'all' ? 'bg-white/20' : 'bg-slate-200 text-slate-700'}`}>
                  {statusCounts.all}
                </span>
              </button>

              {ORDER_STATUSES.map((s) => {
                const m = STATUS_META[s];
                const Icon = m.icon;
                const active = statusFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`inline-flex items-center gap-2 rounded-[5px] pl-3 pr-2 py-2 text-sm font-semibold leading-none transition ${m.tint} ${active ? `ring-2 ring-offset-1 ${m.ring}` : 'hover:brightness-95'}`}
                  >
                    <Icon size={16} /> {m.label}
                    <span className={`rounded-[5px] px-2 py-1 text-xs font-bold leading-none ${m.badge}`}>{statusCounts[s]}</span>
                  </button>
                );
              })}
            </div>

            {/* Date Range */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-700 mr-1">
                <Calendar size={16} className="text-neutral-400" /> Date Range
              </span>
              {([['all', 'All Time'], ['today', 'Today'], ['7d', 'Last 7 Days'], ['30d', 'Last 30 Days']] as const).map(([r, label]) => (
                <button
                  key={r}
                  onClick={() => applyRange(r)}
                  className={`rounded-[5px] px-4 py-2 text-sm font-medium leading-none transition ${
                    range === r ? 'bg-slate-900 text-white' : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className={`rounded-[5px] px-4 py-2 text-sm font-medium leading-none ${range === 'custom' ? 'bg-slate-900 text-white' : 'bg-white border border-neutral-200 text-neutral-500'}`}>
                Custom Range
              </span>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setRange('custom'); }}
                  className="rounded-[5px] border border-neutral-200 pl-9 pr-2 py-2 text-sm text-neutral-600 focus:outline-none focus:ring-2 focus:ring-black" />
              </div>
              <span className="text-neutral-400">→</span>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setRange('custom'); }}
                  className="rounded-[5px] border border-neutral-200 pl-9 pr-2 py-2 text-sm text-neutral-600 focus:outline-none focus:ring-2 focus:ring-black" />
              </div>
            </div>

            {/* Payment + Amount */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-700">
                  <Wallet size={16} className="text-neutral-400" /> Payment Status
                </span>
                <div className="relative">
                  <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)}
                    className="appearance-none rounded-[5px] border border-neutral-200 bg-white pl-3 pr-9 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black min-w-[140px]">
                    <option value="all">All</option>
                    <option value="cod">COD</option>
                    <option value="prepaid">Prepaid</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-700">
                  <IndianRupee size={15} className="text-neutral-400" /> Amount Range
                </span>
                <div className="relative">
                  <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input type="number" value={minTotal} onChange={(e) => setMinTotal(e.target.value)} placeholder="Min Amount"
                    className="w-32 rounded-[5px] border border-neutral-200 pl-8 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <span className="text-neutral-400">—</span>
                <div className="relative">
                  <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input type="number" value={maxTotal} onChange={(e) => setMaxTotal(e.target.value)} placeholder="Max Amount"
                    className="w-32 rounded-[5px] border border-neutral-200 pl-8 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* result count */}
      <p className="text-sm text-neutral-500 mb-2">
        Showing <span className="font-semibold text-neutral-800">{filtered.length}</span> of {initialOrders.length} orders
        {filtersActive ? ' (filtered)' : ''}
      </p>

      <div className="rounded-2xl border border-neutral-300 bg-white overflow-hidden">
        <table className="w-full text-sm border-collapse [&_th]:border [&_th]:border-neutral-200 [&_td]:border [&_td]:border-neutral-200">
          <thead>
            <tr className="text-left text-neutral-600 bg-neutral-100">
              <th className="p-3 font-medium">Order</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <Fragment key={o.id}>
                <tr className="border-b border-neutral-100">
                  <td className="p-3 font-medium">{o.order_no}</td>
                  <td className="p-3">
                    <div>{o.customer_name}</div>
                    <div className="text-xs text-neutral-500">{o.customer_phone}</div>
                  </td>
                  <td className="p-3 text-neutral-600 whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="p-3 font-medium whitespace-nowrap">
                    {formatPrice(Number(o.total))}
                    {o.coupon_code && (
                      <span className="ml-1.5 inline-flex items-center rounded-[5px] bg-emerald-50 text-emerald-600 text-[10px] font-semibold px-1.5 py-0.5 align-middle">🎟️ {o.coupon_code}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      disabled={pending}
                      onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                      className={`rounded-[5px] px-2 py-1 text-xs font-medium capitalize border-0 cursor-pointer ${statusStyle[o.status] ?? ''}`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/admin/orders/${o.id}/label`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Print shipping label"
                        className="rounded-lg p-1.5 hover:bg-neutral-100 text-neutral-700"
                      >
                        <Printer size={16} />
                      </a>
                      <button
                        onClick={() => setOpen(open === o.id ? null : o.id)}
                        className="rounded-lg p-1.5 hover:bg-neutral-100"
                      >
                        {open === o.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
                {open === o.id && (
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    <td colSpan={6} className="p-4 bg-neutral-50">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-neutral-200 bg-white p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">Items</h4>
                          <div className="space-y-2">
                            {o.order_items?.map((it) => (
                              <div key={it.id} className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {it.image && <img src={it.image} alt={it.name} className="w-9 h-11 rounded object-cover bg-neutral-100" />}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium flex items-center gap-1.5">
                                    {it.product_id ? (
                                      <a
                                        href={`/product/${it.product_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 hover:underline"
                                        title="Product preview (opens website in new tab)"
                                      >
                                        {it.name}
                                        <ExternalLink size={13} className="text-neutral-400 shrink-0" />
                                      </a>
                                    ) : (
                                      it.name
                                    )}
                                  </div>
                                  <div className="text-xs text-neutral-500">
                                    {[it.size, it.color].filter(Boolean).join(' · ')} × {it.quantity}
                                  </div>
                                </div>
                                <div className="font-medium">{formatPrice(Number(it.price) * it.quantity)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl border border-neutral-200 bg-white p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">Delivery &amp; payment</h4>
                          <p className="text-sm">{o.customer_name} · {o.customer_phone}</p>
                          {o.customer_email && <p className="text-sm text-neutral-600">{o.customer_email}</p>}
                          <p className="text-sm text-neutral-600 mt-1">
                            {o.address_line}{o.city ? `, ${o.city}` : ''}{o.state ? `, ${o.state}` : ''}{o.pincode ? ` - ${o.pincode}` : ''}
                          </p>
                          <div className="mt-3 text-sm space-y-1">
                            <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatPrice(Number(o.subtotal))}</span></div>
                            {Number(o.discount) > 0 && (
                              <div className="flex justify-between text-emerald-600">
                                <span>Discount{o.coupon_code ? ` (${o.coupon_code})` : ''}</span>
                                <span>− {formatPrice(Number(o.discount))}</span>
                              </div>
                            )}
                            <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>{Number(o.shipping) === 0 ? 'Free' : formatPrice(Number(o.shipping))}</span></div>
                            <div className="flex justify-between font-bold"><span>Total</span><span>{formatPrice(Number(o.total))}</span></div>
                            {(() => {
                              const items = o.order_items ?? [];
                              const known = items.filter((i) => i.cost != null);
                              if (known.length === 0) return null;
                              const profit = known.reduce((a, i) => a + (Number(i.price) - Number(i.cost)) * (i.quantity || 0), 0) - Number(o.discount || 0);
                              const partial = known.length < items.length;
                              return (
                                <div className="flex justify-between text-emerald-600">
                                  <span>Profit{partial ? ' (partial)' : ''}</span>
                                  <span>{formatPrice(profit)}</span>
                                </div>
                              );
                            })()}
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-500">Payment</span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="uppercase">{o.payment_method}</span>
                                {o.payment_status === 'paid' && (
                                  <span className="rounded-[5px] bg-emerald-50 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 uppercase">Paid ✓</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <ShippingEditor order={o} />
                          <div className="mt-4 flex flex-wrap gap-2">
                            <a
                              href={`/admin/orders/${o.id}/invoice`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
                            >
                              <FileText size={16} /> Invoice (PDF)
                            </a>
                            <a
                              href={`/admin/orders/${o.id}/label`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                            >
                              <Printer size={16} /> Shipping label
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">
                  {initialOrders.length === 0 ? 'No orders yet.' : 'No orders match your filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShippingEditor({ order }: { order: OrderRow }) {
  const [courier, setCourier] = useState(order.courier ?? '');
  const [trackingNo, setTrackingNo] = useState(order.tracking_number ?? '');
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? '');
  const [saving, startSave] = useTransition();

  const save = () => {
    startSave(async () => {
      const res = await updateShipping(order.id, { courier, tracking_number: trackingNo, tracking_url: trackingUrl });
      if (res.ok) toast.success('Shipping details saved — visible to the customer');
      else toast.error(res.error);
    });
  };

  const inp = 'w-full h-9 px-2 rounded-[5px] border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10';
  return (
    <div className="mt-4 rounded-lg border border-neutral-200 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">Shipping / Tracking</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input className={inp} value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Courier (e.g. Delhivery)" />
        <input className={inp} value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder="Tracking number" />
        <input className={inp} value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="Tracking link (URL)" />
      </div>
      <button onClick={save} disabled={saving} className="mt-2 inline-flex items-center gap-1.5 rounded-[5px] bg-black text-white px-4 py-1.5 text-xs font-medium disabled:opacity-60">
        {saving ? <Loader2 size={13} className="animate-spin" /> : null} Save shipping
      </button>
    </div>
  );
}
