'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCarousel } from '@/hooks/useCarousel';
import { slideHref } from '@/lib/carousel';

export default function CollectionCarousel() {
  const slides = useCarousel();
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);

  // Auto-play disabled — users swipe or use the arrows to change slides.

  useEffect(() => { if (index >= n && n > 0) setIndex(0); }, [n, index]);

  if (n === 0) return null;
  const go = (d: number) => setIndex((i) => (i + d + n) % n);

  return (
    <>
      {/* DESKTOP: full-screen auto-playing carousel */}
      <section
        data-nav="dark"
        className="hidden lg:block relative w-full h-[72vh] overflow-hidden bg-black"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (dx > 50) go(-1); else if (dx < -50) go(1);
        }}
      >
        {slides.map((s, i) => (
          <Link
            key={i}
            href={slideHref(s)}
            aria-label={s.title || 'Collection'}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.desktopImage} alt={s.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center text-white">
              {s.title && <h2 className="text-3xl xl:text-4xl font-black uppercase tracking-tight font-display">{s.title}</h2>}
              <span className="mt-3 inline-block text-xs tracking-[0.25em] uppercase font-bold border-b border-white/70 pb-1">Shop Now</span>
            </div>
          </Link>
        ))}

        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous" className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-colors">
              <ChevronLeft size={22} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next" className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-colors">
              <ChevronRight size={22} />
            </button>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex gap-2.5">
              {slides.map((_, i) => (
                <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`} className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* MOBILE: 3D stacked carousel */}
      <section
        className="lg:hidden relative pt-10 pb-2 overflow-hidden"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (dx > 40) go(-1); else if (dx < -40) go(1);
        }}
      >
        <div className="relative h-[60vh] max-h-[540px]">
          {slides.map((s, i) => {
            let off = i - index;
            if (off > n / 2) off -= n;
            if (off < -n / 2) off += n;
            const abs = Math.abs(off);
            const style: CSSProperties = {
              transform: `translateX(calc(-50% + ${off * 44}px)) scale(${1 - abs * 0.08})`,
              opacity: abs > 3 ? 0 : 1 - abs * 0.24,
              zIndex: 30 - abs,
              pointerEvents: off === 0 ? 'auto' : 'none',
            };
            return (
              <Link
                key={i}
                href={slideHref(s)}
                style={style}
                aria-hidden={off !== 0}
                className="absolute left-1/2 top-0 w-[74vw] h-full rounded-2xl overflow-hidden bg-neutral-900 transition-all duration-500 ease-out"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.mobileImage} alt={s.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {s.title && <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-lg font-bold tracking-wide uppercase">{s.title}</span>}
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
