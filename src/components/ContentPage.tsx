'use client';

import { useEffect, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DEFAULT_PAGES, mergePageContent, type PageContent, type PageSlug } from '@/lib/pageContent';

function Accordion({ sections }: { sections: PageContent['sections'] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-black/10 dark:divide-white/10 border-y border-black/10 dark:border-white/10">
      {sections.map((s, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-5 text-left"
            >
              <span className="text-base md:text-lg font-bold uppercase tracking-tight">{s.heading}</span>
              {isOpen ? <Minus size={18} className="shrink-0" /> : <Plus size={18} className="shrink-0" />}
            </button>
            {isOpen && (
              <p className="pb-6 -mt-1 text-sm md:text-base leading-relaxed text-black/70 dark:text-white/70 whitespace-pre-line">
                {s.body}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ContentPage({ slug }: { slug: PageSlug }) {
  const [page, setPage] = useState<PageContent>(DEFAULT_PAGES[slug]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/settings/page/${slug}`)
      .then((r) => r.json())
      .then((j) => { if (alive && j?.page) setPage(mergePageContent(j.page, slug)); })
      .catch(() => { /* keep defaults */ });
    return () => { alive = false; };
  }, [slug]);

  const isFaq = slug === 'faq';

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white pb-20 lg:pb-0">
      <Navbar />

      {/* Header */}
      <header className="pt-28 md:pt-36 pb-10 md:pb-14 px-4 border-b border-black/10 dark:border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight font-display">{page.title}</h1>
          {page.intro.trim() !== '' && (
            <p className="mt-5 text-base md:text-lg text-black/60 dark:text-white/60 leading-relaxed">{page.intro}</p>
          )}
        </div>
      </header>

      {/* Body */}
      <main className="px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          {page.sections.length === 0 ? (
            <p className="text-center text-black/50 dark:text-white/50">Content coming soon.</p>
          ) : isFaq ? (
            <Accordion sections={page.sections} />
          ) : (
            <div className="space-y-10">
              {page.sections.map((s, i) => (
                <section key={i}>
                  {s.heading.trim() !== '' && (
                    <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight mb-3 font-display">{s.heading}</h2>
                  )}
                  <p className="text-sm md:text-base leading-relaxed text-black/70 dark:text-white/70 whitespace-pre-line">{s.body}</p>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
