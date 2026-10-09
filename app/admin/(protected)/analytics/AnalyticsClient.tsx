'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, ShoppingCart, IndianRupee, Users, Package, AlertTriangle, Repeat, Wallet, Percent } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import InfoCard from '../../_components/InfoCard';
import ExportMenu from '../../_components/ExportMenu';
import type { Row } from '@/lib/export';

export interface OrderItemLite { product_id: string | null; name: string; price: number; quantity: number; cost: number | null }
export interface OrderLite {
  id: string; status: string | null; subtotal: number | null; shipping: number | null; total: number | null; discount: number | null;
  created_at: string; customer_phone: string | null; customer_name: string | null; order_items: OrderItemLite[];
}
export interface ProductLite { id: string; name: string; category: string | null; stock: number | null; price: number | null; is_active: boolean | null }
export interface CustomerLite { id: string; created_at: string }

const PALETTE = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];
const RANGES = [
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: 'all', label: 'All time', days: 0 },
] as const;

const LOW_STOCK = 5;
const isRevenue = (s: string | null) => s !== 'cancelled';
const dayKey = (iso: string) => iso.slice(0, 10);

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null; // null = "new" (no base)
  return ((curr - prev) / prev) * 100;
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[11px] text-neutral-400">—</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(value).toFixed(0)}%
    </span>
  );
}

export default function AnalyticsClient({
  orders, products, customers,
}: {
  orders: OrderLite[]; products: ProductLite[]; customers: CustomerLite[];
}) {
  const [rangeKey, setRangeKey] = useState<string>('30');
  const range = RANGES.find((r) => r.key === rangeKey) ?? RANGES[1];

  const catOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of products) m.set(p.id, p.category?.trim() || 'Uncategorised');
    return m;
  }, [products]);

  const now = Date.now();
  const DAY = 86_400_000;
  const curStart = range.days ? now - range.days * DAY : 0;
  const prevStart = range.days ? curStart - range.days * DAY : 0;

  const inRange = (iso: string, start: number, end: number) => {
    const t = new Date(iso).getTime();
    return t >= start && t < end;
  };

  const curOrders = useMemo(
    () => orders.filter((o) => (range.days ? inRange(o.created_at, curStart, now + DAY) : true)),
    [orders, range.days, curStart, now]
  );
  const prevOrders = useMemo(
    () => (range.days ? orders.filter((o) => inRange(o.created_at, prevStart, curStart)) : []),
    [orders, range.days, prevStart, curStart]
  );

  const sum = (arr: OrderLite[], f: (o: OrderLite) => number) => arr.reduce((a, o) => a + f(o), 0);
  const revenue = (arr: OrderLite[]) => sum(arr.filter((o) => isRevenue(o.status)), (o) => Number(o.total) || 0);
  const paidCount = (arr: OrderLite[]) => arr.filter((o) => isRevenue(o.status)).length;

  // Profit for one order = sum((price - cost) * qty) over items whose cost is known, minus the order's discount.
  const orderProfit = (o: OrderLite) => {
    let p = 0;
    for (const it of o.order_items) {
      if (it.cost == null) continue;
      p += ((Number(it.price) || 0) - (Number(it.cost) || 0)) * (it.quantity || 0);
    }
    return p - (Number(o.discount) || 0);
  };
  const profit = (arr: OrderLite[]) => sum(arr.filter((o) => isRevenue(o.status)), orderProfit);

  // KPIs
  const curRev = revenue(curOrders);
  const prevRev = revenue(prevOrders);
  const curOrd = paidCount(curOrders);
  const prevOrd = paidCount(prevOrders);
  const curAOV = curOrd ? curRev / curOrd : 0;
  const prevAOV = prevOrd ? prevRev / prevOrd : 0;
  const curProfit = profit(curOrders);
  const prevProfit = profit(prevOrders);
  const margin = curRev ? (curProfit / curRev) * 100 : 0;
  const itemsSold = sum(curOrders.filter((o) => isRevenue(o.status)), (o) => o.order_items.reduce((a, i) => a + (i.quantity || 0), 0));

  const newCustomers = useMemo(
    () => customers.filter((c) => (range.days ? inRange(c.created_at, curStart, now + DAY) : true)).length,
    [customers, range.days, curStart, now]
  );
  const prevNewCustomers = useMemo(
    () => (range.days ? customers.filter((c) => inRange(c.created_at, prevStart, curStart)).length : 0),
    [customers, range.days, prevStart, curStart]
  );

  // Repeat rate (within current range, by phone)
  const repeatRate = useMemo(() => {
    const byPhone = new Map<string, number>();
    for (const o of curOrders) {
      if (!isRevenue(o.status) || !o.customer_phone) continue;
      byPhone.set(o.customer_phone, (byPhone.get(o.customer_phone) ?? 0) + 1);
    }
    const buyers = byPhone.size;
    const repeats = [...byPhone.values()].filter((n) => n > 1).length;
    return buyers ? (repeats / buyers) * 100 : 0;
  }, [curOrders]);

  // Revenue + orders per day
  const perDay = useMemo(() => {
    const m = new Map<string, { date: string; revenue: number; orders: number }>();
    // seed buckets for continuous axis when a fixed range
    if (range.days) {
      for (let i = range.days - 1; i >= 0; i--) {
        const d = dayKey(new Date(now - i * DAY).toISOString());
        m.set(d, { date: d, revenue: 0, orders: 0 });
      }
    }
    for (const o of curOrders) {
      if (!isRevenue(o.status)) continue;
      const d = dayKey(o.created_at);
      const row = m.get(d) ?? { date: d, revenue: 0, orders: 0 };
      row.revenue += Number(o.total) || 0;
      row.orders += 1;
      m.set(d, row);
    }
    return [...m.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((r) => ({ ...r, label: r.date.slice(5) }));
  }, [curOrders, range.days, now]);

  // Status breakdown
  const statusData = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of curOrders) m.set(o.status ?? 'pending', (m.get(o.status ?? 'pending') ?? 0) + 1);
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [curOrders]);

  // Sales by category
  const catData = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of curOrders) {
      if (!isRevenue(o.status)) continue;
      for (const it of o.order_items) {
        const cat = (it.product_id && catOf.get(it.product_id)) || 'Uncategorised';
        m.set(cat, (m.get(cat) ?? 0) + (Number(it.price) || 0) * (it.quantity || 0));
      }
    }
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [curOrders, catOf]);

  // Top products
  const topProducts = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; revenue: number; profit: number }>();
    for (const o of curOrders) {
      if (!isRevenue(o.status)) continue;
      for (const it of o.order_items) {
        const key = it.product_id || it.name;
        const row = m.get(key) ?? { name: it.name, qty: 0, revenue: 0, profit: 0 };
        row.qty += it.quantity || 0;
        row.revenue += (Number(it.price) || 0) * (it.quantity || 0);
        if (it.cost != null) row.profit += ((Number(it.price) || 0) - (Number(it.cost) || 0)) * (it.quantity || 0);
        m.set(key, row);
      }
    }
    return [...m.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [curOrders]);

  // Top customers
  const topCustomers = useMemo(() => {
    const m = new Map<string, { name: string; phone: string; orders: number; spent: number }>();
    for (const o of curOrders) {
      if (!isRevenue(o.status) || !o.customer_phone) continue;
      const row = m.get(o.customer_phone) ?? { name: o.customer_name || '—', phone: o.customer_phone, orders: 0, spent: 0 };
      row.orders += 1;
      row.spent += Number(o.total) || 0;
      m.set(o.customer_phone, row);
    }
    return [...m.values()].sort((a, b) => b.spent - a.spent).slice(0, 10);
  }, [curOrders]);

  const lowStock = useMemo(
    () => products.filter((p) => p.is_active !== false && (p.stock ?? 0) <= LOW_STOCK).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)).slice(0, 12),
    [products]
  );

  const kpis = [
    { label: 'Revenue', value: formatPrice(curRev), delta: pctChange(curRev, prevRev), icon: IndianRupee },
    { label: 'Profit', value: formatPrice(curProfit), delta: pctChange(curProfit, prevProfit), icon: Wallet },
    { label: 'Margin', value: `${margin.toFixed(0)}%`, delta: null, icon: Percent },
    { label: 'Orders', value: String(curOrd), delta: pctChange(curOrd, prevOrd), icon: ShoppingCart },
    { label: 'Avg order value', value: formatPrice(curAOV), delta: pctChange(curAOV, prevAOV), icon: TrendingUp },
    { label: 'New customers', value: String(newCustomers), delta: pctChange(newCustomers, prevNewCustomers), icon: Users },
    { label: 'Items sold', value: String(itemsSold), delta: null, icon: Package },
    { label: 'Repeat rate', value: `${repeatRate.toFixed(0)}%`, delta: null, icon: Repeat },
  ];

  const card = 'rounded-2xl border border-neutral-200 bg-white p-5';

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">Your store at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-[5px] border border-neutral-200 overflow-hidden text-xs">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeKey(r.key)}
                className={`px-3 py-2 ${rangeKey === r.key ? 'bg-black text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <ExportMenu
            filename={`analytics-summary-${rangeKey}`}
            title={`Store summary — ${range.label}`}
            label="Report"
            getData={() => {
              const headers = ['Metric', 'Value'];
              const kpiRows: Row[] = kpis.map((k) => [k.label, k.value]);
              const dayHeader: Row = ['— Daily —', ''];
              const dayRows: Row[] = perDay.map((d) => [d.date, `${formatPrice(d.revenue)} · ${d.orders} orders`]);
              return { headers, rows: [...kpiRows, dayHeader, ...dayRows] };
            }}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {kpis.map(({ label, value, delta, icon: Icon }) => (
          <div key={label} className={card}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">{label}</span>
              <Icon size={16} className="text-neutral-400" />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div className="text-2xl font-bold">{value}</div>
              <Delta value={delta} />
            </div>
          </div>
        ))}
      </div>

      {/* Revenue trend + Orders/day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className={card}>
          <h3 className="text-sm font-semibold mb-3">Revenue</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={perDay} margin={{ left: -10, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(v: number) => formatPrice(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className={card}>
          <h3 className="text-sm font-semibold mb-3">Orders per day</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={perDay} margin={{ left: -20, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={32} />
              <Tooltip />
              <Bar dataKey="orders" fill="#0f172a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className={card}>
          <h3 className="text-sm font-semibold mb-3">Order status</h3>
          {statusData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {statusData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className={card}>
          <h3 className="text-sm font-semibold mb-3">Sales by category</h3>
          {catData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={catData} layout="vertical" margin={{ left: 20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v: number) => formatPrice(v)} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top products + Top customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Top products</h3>
            <ExportMenu
              filename="top-products"
              title="Top products"
              label="Export"
              disabled={topProducts.length === 0}
              getData={() => ({ headers: ['Product', 'Qty', 'Revenue', 'Profit'], rows: topProducts.map((p) => [p.name, p.qty, p.revenue, p.profit]) })}
            />
          </div>
          <Table
            head={['Product', 'Qty', 'Revenue', 'Profit']}
            rows={topProducts.map((p) => [p.name, String(p.qty), formatPrice(p.revenue), p.profit ? formatPrice(p.profit) : '—'])}
            empty="No sales in this period."
          />
        </div>
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Top customers</h3>
            <ExportMenu
              filename="top-customers"
              title="Top customers"
              label="Export"
              disabled={topCustomers.length === 0}
              getData={() => ({ headers: ['Name', 'Phone', 'Orders', 'Spent'], rows: topCustomers.map((c) => [c.name, c.phone, c.orders, c.spent]) })}
            />
          </div>
          <Table
            head={['Customer', 'Orders', 'Spent']}
            rows={topCustomers.map((c) => [`${c.name} · ${c.phone}`, String(c.orders), formatPrice(c.spent)])}
            empty="No customers in this period."
          />
        </div>
      </div>

      {/* Low stock */}
      <div className={`${card} mb-6`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-500" /> Low stock (≤ {LOW_STOCK})
          </h3>
          <ExportMenu
            filename="low-stock"
            title="Low stock"
            label="Export"
            disabled={lowStock.length === 0}
            getData={() => ({ headers: ['Product', 'Category', 'Stock'], rows: lowStock.map((p) => [p.name, p.category || '', p.stock ?? 0]) })}
          />
        </div>
        <Table
          head={['Product', 'Category', 'Stock']}
          rows={lowStock.map((p) => [p.name, p.category || '—', String(p.stock ?? 0)])}
          empty="All products are well stocked. 🎉"
        />
      </div>

      <InfoCard
        title="How Analytics works"
        intro="This page reads your real orders, products and customers — nothing is made up."
        flow={['Pick a date range', 'See the numbers', 'Spot top sellers', 'Act on low stock']}
        steps={[
          { title: 'Date range', desc: 'Top-right buttons switch between 7 / 30 / 90 days and all time. Every number and chart updates.' },
          { title: 'Up / down %', desc: 'Each KPI compares to the previous equal period (e.g. this 30 days vs the 30 before).' },
          { title: 'Revenue', desc: 'Counts every order except cancelled ones. Avg order value = revenue ÷ orders.' },
          { title: 'Low stock', desc: 'Products with 5 or fewer left — restock these before they sell out.' },
        ]}
        note="Use the Report / Export buttons to download any of this as Excel, PDF or CSV."
      />
    </div>
  );
}

function Empty() {
  return <div className="h-[240px] flex items-center justify-center text-sm text-neutral-400">No data for this period.</div>;
}

function Table({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-neutral-400 py-6 text-center">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-500 border-b border-neutral-200">
            {head.map((h, i) => <th key={i} className={`py-2 pr-3 font-medium ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-neutral-100 last:border-0">
              {r.map((c, j) => <td key={j} className={`py-2 pr-3 ${j > 0 ? 'text-right tabular-nums' : 'font-medium'}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
