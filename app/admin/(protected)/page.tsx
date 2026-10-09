import Link from 'next/link';
import { Package, Eye, EyeOff, Plus, Users, ShoppingCart, Truck, Star, ShoppingBag, Boxes, RotateCcw, BellRing } from 'lucide-react';
import { getServerSupabase } from '@/lib/supabase/server';
import InfoCard from '../_components/InfoCard';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const supabase = await getServerSupabase();
  const [{ data: products }, { count: customerCount }, { data: orders }, { count: pendingReviews }, { count: abandonedCount }] = await Promise.all([
    supabase!.from('products').select('id, is_active, stock, reorder_level'),
    supabase!.from('customers').select('id', { count: 'exact', head: true }),
    supabase!.from('orders').select('status'),
    supabase!.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
    supabase!.from('carts').select('customer_id', { count: 'exact', head: true }),
  ]);
  const { count: pendingReturns } = await supabase!.from('returns').select('id', { count: 'exact', head: true }).eq('status', 'requested');
  const { count: waitingNotify } = await supabase!.from('stock_notifications').select('id', { count: 'exact', head: true }).eq('notified', false);

  const total = products?.length ?? 0;
  const active = products?.filter((p) => p.is_active).length ?? 0;
  const hidden = total - active;

  const activeProducts = (products ?? []).filter((p) => p.is_active !== false);
  const outCount = activeProducts.filter((p) => (Number(p.stock) || 0) <= 0).length;
  const lowCount = activeProducts.filter((p) => {
    const s = Number(p.stock) || 0;
    return s > 0 && s <= (Number(p.reorder_level) || 0);
  }).length;

  const newOrders = (orders ?? []).filter((o) => o.status === 'pending').length;
  const toShip = (orders ?? []).filter((o) => o.status === 'confirmed').length;

  const actions = [
    { label: 'New orders', hint: 'confirm & process', value: newOrders, href: '/admin/orders', icon: ShoppingCart, color: 'blue' as const },
    { label: 'To ship', hint: 'print label & dispatch', value: toShip, href: '/admin/orders', icon: Truck, color: 'violet' as const },
    { label: 'Reviews to approve', hint: 'go live on site', value: pendingReviews ?? 0, href: '/admin/reviews', icon: Star, color: 'amber' as const },
    { label: 'Returns to review', hint: 'approve & refund', value: pendingReturns ?? 0, href: '/admin/returns', icon: RotateCcw, color: 'violet' as const },
    { label: 'Abandoned carts', hint: 'win them back', value: abandonedCount ?? 0, href: '/admin/abandoned', icon: ShoppingBag, color: 'emerald' as const },
    { label: 'Back-in-stock waitlist', hint: 'notify on restock', value: waitingNotify ?? 0, href: '/admin/waitlist', icon: BellRing, color: 'blue' as const },
    { label: 'Low / out of stock', hint: 'reorder soon', value: outCount + lowCount, href: '/admin/inventory', icon: Boxes, color: 'red' as const },
  ];
  const colorCls: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-600',
    violet: 'border-violet-200 bg-violet-50 text-violet-600',
    amber: 'border-amber-200 bg-amber-50 text-amber-600',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    red: 'border-red-200 bg-red-50 text-red-600',
  };
  const totalToDo = actions.reduce((a, x) => a + x.value, 0);

  const stats = [
    { label: 'Total products', value: total, icon: Package },
    { label: 'Live on site', value: active, icon: Eye },
    { label: 'Hidden', value: hidden, icon: EyeOff },
    { label: 'Customers', value: customerCount ?? 0, icon: Users },
  ];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back 👋</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Here&apos;s a quick look at your store.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
        >
          <Plus size={16} /> Manage products
        </Link>
      </div>

      {/* Action Center */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">Action Center</h2>
          {totalToDo === 0 && <span className="text-sm text-emerald-600 font-medium">All caught up 🎉</span>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {actions.map(({ label, hint, value, href, icon: Icon, color }) => (
            <Link
              key={label}
              href={href}
              className={`rounded-2xl border p-4 transition-colors ${value > 0 ? `${colorCls[color]} hover:brightness-95` : 'border-neutral-200 bg-white text-neutral-400 hover:bg-neutral-50'}`}
            >
              <div className="flex items-center justify-between">
                <Icon size={18} />
                <span className="text-2xl font-bold">{value}</span>
              </div>
              <p className={`mt-2 text-sm font-semibold ${value > 0 ? '' : 'text-neutral-600'}`}>{label}</p>
              <p className="text-[11px] opacity-80">{hint}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">{label}</span>
              <Icon size={18} className="text-neutral-400" />
            </div>
            <div className="mt-3 text-3xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <InfoCard
        title="Welcome — how your dashboard works"
        intro="This is your control centre. Everything you change here appears on your website instantly."
        flow={['Add / edit products', 'Customers order', 'Manage orders', 'Print & ship']}
        steps={[
          { title: 'Products', desc: 'Add, edit, hide or delete items in your catalog. Hidden items stay saved but are not shown to customers.' },
          { title: 'Orders', desc: 'See customer orders, update their status, and print 4×6 shipping labels.' },
          { title: 'Live updates', desc: 'Any change you make here shows on the website right away — no extra step.' },
          { title: 'Customers', desc: 'See everyone who has signed up — their phone, orders, total spent and saved addresses.' },
          { title: 'Coming soon', desc: 'Collections, Analytics and CRM arrive in later phases.' },
        ]}
        note="Open the “How it works” card on any page to learn that page."
        defaultOpen
      />
    </div>
  );
}
