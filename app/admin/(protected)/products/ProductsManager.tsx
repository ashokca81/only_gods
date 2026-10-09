'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Eye, Search, LayoutGrid, Tag, ArrowUpDown, ChevronDown, Upload } from 'lucide-react';
import type { ProductRow } from '@/lib/products-map';
import { formatPrice } from '@/lib/format';
import { deleteProduct, toggleActive } from './actions';
import InfoCard from '../../_components/InfoCard';
import ExportMenu from '../../_components/ExportMenu';
import type { Row } from '@/lib/export';

export default function ProductsManager({
  initialProducts,
}: {
  initialProducts: ProductRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // filters + bulk selection
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'hidden'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_high' | 'price_low' | 'name'>('newest');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const refresh = () => router.refresh();

  const remove = (r: ProductRow) => {
    if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteProduct(r.id);
      if (!res.ok) alert(res.error);
      else refresh();
    });
  };
  const flipActive = (r: ProductRow) => {
    startTransition(async () => {
      const res = await toggleActive(r.id, !(r.is_active ?? true));
      if (!res.ok) alert(res.error);
      else refresh();
    });
  };

  const categories = useMemo(
    () => Array.from(new Set(initialProducts.map((p) => p.category).filter(Boolean))).sort(),
    [initialProducts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = initialProducts.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (statusFilter === 'live' && !p.is_active) return false;
      if (statusFilter === 'hidden' && p.is_active) return false;
      return true;
    });
    const sorted = [...list];
    if (sortBy === 'oldest') sorted.reverse();
    else if (sortBy === 'price_high') sorted.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === 'price_low') sorted.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [initialProducts, query, categoryFilter, statusFilter, sortBy]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());

  const bulkDelete = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} product(s)? This cannot be undone.`)) return;
    startTransition(async () => {
      for (const id of ids) await deleteProduct(id);
      clearSelection();
      refresh();
    });
  };
  const bulkSetActive = (active: boolean) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    startTransition(async () => {
      for (const id of ids) await toggleActive(id, active);
      clearSelection();
      refresh();
    });
  };

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold">Products</h1>
            <span className="rounded-[5px] bg-neutral-100 text-neutral-600 text-xs font-semibold px-2.5 py-1">
              {initialProducts.length} products
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Manage your products, update details, and keep your store fresh.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            filename="products"
            title="Products"
            disabled={filtered.length === 0}
            getData={() => {
              const headers = ['Name', 'Category', 'Collections', 'Price', 'MRP', 'Stock', 'SKU', 'Brand', 'Status', 'Tags'];
              const rows: Row[] = filtered.map((p) => [
                p.name,
                p.category || '',
                (p.collections ?? []).join('; '),
                Number(p.price) || 0,
                p.original_price != null ? Number(p.original_price) : '',
                p.stock ?? 0,
                p.sku ?? '',
                p.brand ?? '',
                p.is_active !== false ? 'Live' : 'Hidden',
                (p.tags ?? []).join('; '),
              ]);
              return { headers, rows };
            }}
          />
          <Link
            href="/admin/products/import"
            className="inline-flex items-center gap-2 rounded-[5px] border border-neutral-200 bg-white px-4 h-11 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Upload size={16} /> Import
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-[5px] bg-blue-600 text-white px-5 h-11 text-sm font-semibold hover:bg-blue-700"
          >
            <Plus size={18} /> Add Product
          </Link>
        </div>
      </div>

      <InfoCard
        title="How the Products page works"
        intro="This is your product catalog — search, filter, edit, and control what customers see."
        flow={['Search / filter', 'Add or Edit', 'Set Live / Hidden', 'Delete']}
        steps={[
          { title: 'Find products', desc: 'Search by name, or filter by category, status and sort order.' },
          { title: 'Add / Edit', desc: '“Add Product” opens a full page. The ✏️ icon edits an existing product on the same page.' },
          { title: 'Preview', desc: 'The 👁 icon opens the product on your live website in a new tab.' },
          { title: 'Live or Hidden', desc: 'Click the green “Live” pill to hide a product (kept, but not shown to customers).' },
          { title: 'Bulk actions', desc: 'Tick the checkboxes to set many products Live/Hidden or delete them together.' },
        ]}
        note="“Stock: N” under each product is the total across all colours and sizes."
      />

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex items-center bg-white border border-neutral-200 rounded-[5px] flex-1 min-w-[240px] h-11">
          <Search size={18} className="absolute left-3 text-neutral-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by name…"
            className="w-full h-full bg-transparent rounded-[5px] pl-10 pr-3 text-sm leading-none placeholder:text-neutral-400 focus:outline-none"
          />
        </div>

        <div className="relative">
          <LayoutGrid size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none rounded-[5px] border border-neutral-200 bg-white pl-9 pr-8 h-11 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black">
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        </div>

        <div className="relative">
          <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="appearance-none rounded-[5px] border border-neutral-200 bg-white pl-9 pr-8 h-11 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black">
            <option value="all">All Status</option>
            <option value="live">Live</option>
            <option value="hidden">Hidden</option>
          </select>
          <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        </div>

        <div className="relative">
          <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="appearance-none rounded-[5px] border border-neutral-200 bg-white pl-9 pr-8 h-11 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_high">Price: High → Low</option>
            <option value="price_low">Price: Low → High</option>
            <option value="name">Name A–Z</option>
          </select>
          <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-3 rounded-[5px] border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm">
          <span className="font-semibold">{selected.size} selected</span>
          <button onClick={() => bulkSetActive(true)} disabled={pending} className="rounded-[5px] border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-100">Set Live</button>
          <button onClick={() => bulkSetActive(false)} disabled={pending} className="rounded-[5px] border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-100">Hide</button>
          <button onClick={bulkDelete} disabled={pending} className="rounded-[5px] bg-red-50 text-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-red-100">Delete</button>
          <button onClick={clearSelection} className="ml-auto text-xs text-neutral-500 hover:text-neutral-800">Clear selection</button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 bg-neutral-50 border-b border-neutral-200">
              <th className="p-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 align-middle accent-black" />
              </th>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const live = p.is_active ?? true;
              return (
                <tr key={p.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="h-4 w-4 align-middle accent-black" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt={p.name} className="h-12 w-11 rounded-[5px] object-cover bg-neutral-100" />
                      <div>
                        <div className="font-semibold text-neutral-900">{p.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {p.trending && <span className="text-[10px] font-semibold rounded-[5px] bg-neutral-900 text-white px-1.5 py-0.5">Trending</span>}
                          {p.new_arrival && <span className="text-[10px] font-semibold rounded-[5px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5">New</span>}
                          {(p.stock ?? 0) > 0
                            ? <span className="text-[11px] text-neutral-400">Stock: {p.stock}</span>
                            : <span className="text-[11px] font-medium text-red-500">Out of stock</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-neutral-600">{p.category || '—'}</td>
                  <td className="p-3">
                    <span className="font-semibold">{formatPrice(Number(p.price))}</span>
                    {p.original_price != null && (
                      <span className="ml-1.5 text-neutral-400 line-through text-xs">{formatPrice(Number(p.original_price))}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => flipActive(p)}
                      disabled={pending}
                      title="Click to toggle visibility on the website"
                      className={`inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-xs font-semibold ${live ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                      {live ? 'Live' : 'Hidden'}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <a href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer" title="Preview on website"
                        className="rounded-[5px] p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700">
                        <Eye size={16} />
                      </a>
                      <Link href={`/admin/products/${p.id}/edit`} title="Edit"
                        className="rounded-[5px] p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700">
                        <Pencil size={16} />
                      </Link>
                      <button onClick={() => remove(p)} disabled={pending} title="Delete" className="rounded-[5px] p-2 bg-red-50 text-red-600 hover:bg-red-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">
                  {initialProducts.length === 0 ? 'No products yet. Click “Add Product”.' : 'No products match your filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
