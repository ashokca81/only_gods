'use client';

import { useMemo, useState } from 'react';
import { Search, Users, Phone, ShoppingBag, MapPin, X } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import InfoCard from '../../_components/InfoCard';
import ExportMenu from '../../_components/ExportMenu';
import type { Row } from '@/lib/export';

export interface AddressRow {
  id: string;
  name: string | null;
  phone: string | null;
  line: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  is_default: boolean;
}

export interface CustomerRow {
  id: string;
  phone: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  addresses: AddressRow[];
  orders: { id: string; total: number | null; status: string | null; created_at: string; customer_email?: string | null }[];
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Derived extends CustomerRow {
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  addressCount: number;
  email: string;
}

export default function CustomersManager({ initialCustomers }: { initialCustomers: CustomerRow[] }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Derived | null>(null);
  const [tab, setTab] = useState<'orders' | 'addresses'>('orders');
  const [segment, setSegment] = useState<'all' | 'buyers' | 'repeat' | 'high' | 'noorders' | 'withemail'>('all');

  const openCustomer = (c: Derived) => {
    setTab('orders');
    setSelected(c);
  };

  const rows = useMemo<Derived[]>(() => {
    return initialCustomers.map((c) => {
      const orders = c.orders ?? [];
      const totalSpent = orders.reduce((a, o) => a + (Number(o.total) || 0), 0);
      const lastOrderAt = orders.length
        ? orders.reduce((a, o) => (o.created_at > a ? o.created_at : a), orders[0].created_at)
        : null;
      const email = orders.map((o) => o.customer_email).find((e) => e && e.trim()) ?? '';
      return {
        ...c,
        ordersCount: orders.length,
        totalSpent,
        lastOrderAt,
        addressCount: c.addresses?.length ?? 0,
        email,
      };
    });
  }, [initialCustomers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => (r.name ?? '').toLowerCase().includes(q) || r.phone.includes(q)
    );
  }, [rows, query]);

  const totalRevenue = rows.reduce((a, r) => a + r.totalSpent, 0);

  const segmentRows = () => {
    let list = rows;
    if (segment === 'buyers') list = rows.filter((r) => r.ordersCount >= 1);
    else if (segment === 'repeat') list = rows.filter((r) => r.ordersCount >= 2);
    else if (segment === 'high') list = rows.filter((r) => r.totalSpent > 0).sort((a, b) => b.totalSpent - a.totalSpent);
    else if (segment === 'noorders') list = rows.filter((r) => r.ordersCount === 0);
    else if (segment === 'withemail') list = rows.filter((r) => r.email.trim() !== '');
    const headers = ['Name', 'Phone', 'Email', 'Orders', 'Spent', 'Joined'];
    const data: Row[] = list.map((r) => [
      r.name?.trim() || 'Unnamed',
      r.phone,
      r.email,
      r.ordersCount,
      r.totalSpent,
      fmtDate(r.created_at),
    ]);
    return { headers, rows: data };
  };

  const segmentLabels: Record<typeof segment, string> = {
    all: 'All customers',
    buyers: 'Buyers (1+ orders)',
    repeat: 'Repeat buyers (2+)',
    high: 'High spenders',
    noorders: 'Signed up, no orders',
    withemail: 'Has email (email marketing)',
  };

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Everyone who has signed up on your store.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value as typeof segment)}
            title="Marketing segment to export"
            className="h-9 rounded-[5px] border border-neutral-200 bg-white text-sm px-2 focus:outline-none"
          >
            {(Object.keys(segmentLabels) as (typeof segment)[]).map((k) => (
              <option key={k} value={k}>{segmentLabels[k]}</option>
            ))}
          </select>
          <ExportMenu
            filename={`customers-${segment}`}
            title={`Customers — ${segmentLabels[segment]}`}
            getData={segmentRows}
            label="Export"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">Total customers</span>
            <Users size={18} className="text-neutral-400" />
          </div>
          <div className="mt-3 text-3xl font-bold">{rows.length}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">Total orders</span>
            <ShoppingBag size={18} className="text-neutral-400" />
          </div>
          <div className="mt-3 text-3xl font-bold">
            {rows.reduce((a, r) => a + r.ordersCount, 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">Revenue</span>
            <span className="text-neutral-400 text-lg">₹</span>
          </div>
          <div className="mt-3 text-3xl font-bold">{formatPrice(totalRevenue)}</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full h-11 pl-9 pr-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            {rows.length === 0 ? 'No customers yet.' : 'No customers match your search.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-200">
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Phone</th>
                  <th className="py-3 px-4 font-medium text-center">Orders</th>
                  <th className="py-3 px-4 font-medium text-right">Spent</th>
                  <th className="py-3 px-4 font-medium">Last order</th>
                  <th className="py-3 px-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openCustomer(c)}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {c.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-500">
                            {(c.name?.trim()?.[0] ?? c.phone.slice(-2, -1)).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{c.name?.trim() || 'Unnamed'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">+91 {c.phone}</td>
                    <td className="py-3 px-4 text-center">{c.ordersCount}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatPrice(c.totalSpent)}</td>
                    <td className="py-3 px-4 text-neutral-600">{fmtDate(c.lastOrderAt)}</td>
                    <td className="py-3 px-4 text-neutral-600">{fmtDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <InfoCard
          title="How the Customers page works"
          intro="Every person who signs up with their mobile number appears here automatically."
          flow={['Customer signs up', 'Places orders', 'You see them here', 'Click for details']}
          steps={[
            { title: 'The list', desc: 'Name, phone, how many orders they placed, total money spent, last order and join date.' },
            { title: 'Search', desc: 'Type a name or phone number to find a customer instantly.' },
            { title: 'Click a row', desc: 'Opens their detail panel. Tap the Orders or Addresses tile to see that full list.' },
            { title: 'Privacy', desc: 'Only you (admin) can see this. Customers never see each other.' },
          ]}
          note="This updates live — a new signup shows the moment they verify their OTP."
        />
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-5 h-16 flex items-center justify-between">
              <h2 className="font-bold">Customer details</h2>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="flex items-center gap-4">
                {selected.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-lg font-bold text-neutral-500">
                    {(selected.name?.trim()?.[0] ?? selected.phone.slice(-2, -1)).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-lg">{selected.name?.trim() || 'Unnamed'}</p>
                  <p className="text-sm text-neutral-500 flex items-center gap-1">
                    <Phone size={13} /> +91 {selected.phone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <button
                  onClick={() => setTab('orders')}
                  className={`rounded-xl p-3 border transition-colors ${
                    tab === 'orders'
                      ? 'bg-black text-white border-black'
                      : 'bg-neutral-50 border-transparent hover:border-neutral-300'
                  }`}
                >
                  <p className="text-xl font-bold">{selected.ordersCount}</p>
                  <p className={`text-[11px] uppercase tracking-wide ${tab === 'orders' ? 'text-white/70' : 'text-neutral-500'}`}>Orders</p>
                </button>
                <div className="rounded-xl bg-neutral-50 p-3 border border-transparent">
                  <p className="text-xl font-bold">{formatPrice(selected.totalSpent)}</p>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wide">Spent</p>
                </div>
                <button
                  onClick={() => setTab('addresses')}
                  className={`rounded-xl p-3 border transition-colors ${
                    tab === 'addresses'
                      ? 'bg-black text-white border-black'
                      : 'bg-neutral-50 border-transparent hover:border-neutral-300'
                  }`}
                >
                  <p className="text-xl font-bold">{selected.addressCount}</p>
                  <p className={`text-[11px] uppercase tracking-wide ${tab === 'addresses' ? 'text-white/70' : 'text-neutral-500'}`}>Addresses</p>
                </button>
              </div>

              {tab === 'orders' ? (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <ShoppingBag size={14} /> Orders
                  </h3>
                  {selected.orders.length === 0 ? (
                    <p className="text-sm text-neutral-400">No orders yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {[...selected.orders]
                        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
                        .slice(0, 20)
                        .map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium">{fmtDate(o.created_at)}</p>
                              <p className="text-xs text-neutral-500 capitalize">
                                {o.status ?? 'pending'} · #{o.id.slice(0, 8)}
                              </p>
                            </div>
                            <span className="font-semibold">{formatPrice(Number(o.total) || 0)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <MapPin size={14} /> Addresses
                  </h3>
                  {selected.addresses.length === 0 ? (
                    <p className="text-sm text-neutral-400">No saved addresses.</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.addresses.map((a) => (
                        <div key={a.id} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{a.name?.trim() || 'Address'}</span>
                            {a.is_default && (
                              <span className="text-[10px] uppercase tracking-wide bg-black text-white rounded px-1.5 py-0.5">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-neutral-600 mt-0.5">{a.line}</p>
                          <p className="text-neutral-600">
                            {[a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                          </p>
                          {a.phone && (
                            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                              <Phone size={11} /> +91 {a.phone}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-neutral-400 flex items-center gap-1">
                <MapPin size={12} /> Joined {fmtDate(selected.created_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
