import Link from 'next/link';
import { Image as ImageIcon, Film, Columns, LayoutGrid, Zap, Megaphone, ReceiptText, PanelBottom, FileText, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const sections = [
  { href: '/admin/settings/hero', title: 'Hero', desc: 'Home top banner — image/video, title and button.', icon: ImageIcon },
  { href: '/admin/settings/runway', title: 'Runway (The Season)', desc: 'The big scrolling gallery — pick which collections show.', icon: Film },
  { href: '/admin/settings/collection-section', title: '“The Collection” section', desc: 'The split-screen block — left image + chosen categories.', icon: Columns },
  { href: '/admin/settings/home-products', title: 'Home products', desc: 'Pick the products shown in the home grid (up to 8).', icon: LayoutGrid },
  { href: '/admin/settings/footer', title: 'Footer', desc: 'All footer text and links — logo, columns, socials, legal.', icon: PanelBottom },
  { href: '/admin/settings/pages', title: 'Pages', desc: 'Edit About, Events, FAQ, Terms, Privacy, Cookies content.', icon: FileText },
  { href: '/admin/settings/flash', title: 'Flash sale', desc: 'Store-wide timed discount with a countdown bar.', icon: Zap },
  { href: '/admin/settings/announcement', title: 'Announcement bar', desc: 'The thin message strip at the very top of the site.', icon: Megaphone },
  { href: '/admin/settings/gst', title: 'GST / Tax invoice', desc: 'Seller GSTIN and tax settings for invoices.', icon: ReceiptText },
];

export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Pick a section to edit. Each one has its own page.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map(({ href, title, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
          >
            <div className="w-10 h-10 shrink-0 rounded-[5px] bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700">
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{title}</p>
                <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
