import Link from 'next/link';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { PAGE_SLUGS, PAGE_META } from '@/lib/pageContent';

export const dynamic = 'force-dynamic';

export default function PagesMenu() {
  return (
    <div className="max-w-3xl">
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft size={15} /> Settings
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pages</h1>
        <p className="text-sm text-neutral-500 mt-1">Edit the content of your site pages.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PAGE_SLUGS.map((slug) => (
          <Link
            key={slug}
            href={`/admin/settings/pages/${slug}`}
            className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
          >
            <div className="w-10 h-10 shrink-0 rounded-[5px] bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700">
              <FileText size={18} />
            </div>
            <span className="flex-1 font-semibold">{PAGE_META[slug].label}</span>
            <ChevronRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  );
}
