'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  BellRing,
  Layers,
  Tag,
  ShoppingCart,
  ShoppingBag,
  RotateCcw,
  Ticket,
  Star,
  Users,
  Mail,
  BarChart3,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';

const nav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, ready: true },
  { label: 'Products', href: '/admin/products', icon: Package, ready: true },
  { label: 'Inventory', href: '/admin/inventory', icon: Boxes, ready: true },
  { label: 'Waitlist', href: '/admin/waitlist', icon: BellRing, ready: true },
  { label: 'Categories', href: '/admin/categories', icon: Tag, ready: true },
  { label: 'Collections', href: '/admin/collections', icon: Layers, ready: true },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart, ready: true },
  { label: 'Returns', href: '/admin/returns', icon: RotateCcw, ready: true },
  { label: 'Coupons', href: '/admin/coupons', icon: Ticket, ready: true },
  { label: 'Abandoned', href: '/admin/abandoned', icon: ShoppingBag, ready: true },
  { label: 'Reviews', href: '/admin/reviews', icon: Star, ready: true },
  { label: 'Customers', href: '/admin/customers', icon: Users, ready: true },
  { label: 'Subscribers', href: '/admin/subscribers', icon: Mail, ready: true },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, ready: true },
  { label: 'Media (R2)', href: '/admin/media', icon: ImageIcon, ready: false },
  { label: 'Settings', href: '/admin/settings', icon: Settings, ready: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <aside className="hidden md:flex md:w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="h-16 flex items-center px-6 border-b border-neutral-200">
        <span className="font-bold tracking-tight text-lg">ONLY GODS</span>
        <span className="ml-2 text-[10px] uppercase tracking-widest text-neutral-400">
          Admin
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ label, href, icon: Icon, ready }) => {
          const active = isActive(href);
          const base =
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors';
          if (!ready) {
            return (
              <div
                key={href}
                className={`${base} text-neutral-300 cursor-not-allowed select-none`}
                title="Coming in a later phase"
              >
                <Icon size={18} />
                <span>{label}</span>
                <span className="ml-auto text-[9px] uppercase tracking-wider text-neutral-300">
                  soon
                </span>
              </div>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={`${base} ${
                active
                  ? 'bg-black text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
