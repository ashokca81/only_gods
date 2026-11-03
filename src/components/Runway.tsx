'use client';

import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';
import { useRunwaySelection } from '@/hooks/useRunwaySelection';

interface RunwayLook { image: string; title: string; description?: string; href: string; }

const RunwayCard = ({ look, className = "" }: { look: RunwayLook, className?: string }) => (
    <div className={`relative group ${className}`}>
        <Link href={look.href} className="block relative w-full h-full overflow-hidden">
            <img
                src={look.image}
                alt={look.title}
                className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                loading="lazy"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />

            {/* Floating Action Button */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-500 rotate-0 lg:rotate-45 lg:group-hover:rotate-0 bg-white/10 lg:bg-transparent">
                <ArrowUpRight size={20} className="text-white" />
            </div>

            {/* Content */}
            <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 translate-y-0 lg:translate-y-4 lg:group-hover:translate-y-0 transition-transform duration-500">
                <span className="text-3xl md:text-4xl font-black uppercase font-display tracking-tight block mb-2 text-white">{look.title}</span>
                {look.description ? (
                    <span className="text-[10px] md:text-xs tracking-[0.2em] font-bold text-white/70 uppercase border border-white/30 px-3 py-1 rounded-full">{look.description}</span>
                ) : null}
            </div>
        </Link>
    </div>
);

const Runway = () => {
    const collections = useCollections();
    const selected = useRunwaySelection();
    const chosen = selected.length ? collections.filter((c) => selected.includes(c.title)) : collections;
    const looks: RunwayLook[] = chosen.map((c) => ({
        image: c.image,
        title: c.title,
        href: `/shop?collection=${encodeURIComponent(c.title)}`,
    }));
    // Desktop Scroll Logic
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
    });
    // Slide exactly until the last card is fully in view (measured, not a fixed %).
    const trackRef = useRef<HTMLDivElement>(null);
    const distance = useMotionValue(0);
    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        const measure = () => distance.set(Math.max(0, el.scrollWidth - window.innerWidth));
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        window.addEventListener('resize', measure);
        return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
    }, [distance, looks.length]);
    const x = useTransform([scrollYProgress, distance], ([p, d]) => -(p as number) * (d as number));

    return (
        <>
            {/* MOBILE LAYOUT: Native Horizontal Scroll (Snap) */}
            <section className="lg:hidden pt-2 pb-2 bg-white text-black dark:bg-neutral-950 dark:text-white overflow-hidden">
                {/* Horizontal Scroll Container */}
                <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 gap-4 pb-4">
                    {looks.map((look, i) => (
                        <div key={i} className="snap-center shrink-0 w-[85vw] mx-auto">
                            <RunwayCard look={look} className="aspect-[3/4] rounded-none" />
                        </div>
                    ))}
                </div>
            </section>

            {/* DESKTOP LAYOUT: Scroll-Jacking (Parallax) */}
            <section ref={targetRef} className="hidden lg:block relative h-[200vh] bg-white text-black dark:bg-neutral-950 dark:text-white">
                <div className="sticky top-0 h-screen overflow-hidden">
                    {/* Background layer for mix-blend-difference to work against */}
                    <div className="absolute inset-0 bg-white dark:bg-neutral-950 -z-10" />

                    {/* Parallax Background Title */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none opacity-[0.04]">
                        <h2 className="text-[20vw] font-black uppercase tracking-tighter leading-none whitespace-nowrap font-display">
                            The Season
                        </h2>
                    </div>

                    {/* Header */}
                    <div className="absolute top-20 left-20 z-10 mix-blend-difference text-white">
                        {/* Campaign text removed as requested */}
                    </div>

                    {/* Horizontal Scroll Track */}
                    <motion.div ref={trackRef} style={{ x }} className="flex w-max h-full items-center pl-[30vw] pr-[10vw] gap-16">
                        {looks.map((look, i) => (
                            <div key={i} className="relative shrink-0 w-[24vw] aspect-[2/3] group">
                                <RunwayCard look={look} className="h-full w-full transition-all duration-700 hover:scale-105" />
                            </div>
                        ))}
                    </motion.div>

                    {/* Scroll Progress Indicator */}
                    <div className="absolute bottom-10 left-20 right-20 flex items-center gap-8">
                        <span className="text-xs font-bold tracking-widest uppercase text-black/40 dark:text-white/40">Scroll to Explore</span>
                        <div className="h-[1px] bg-black/10 dark:bg-white/10 flex-1 relative overflow-hidden">
                            <motion.div style={{ width: scrollYProgress, scaleX: scrollYProgress }} className="absolute inset-0 bg-red-500 origin-left" />
                        </div>
                        <span className="text-xs font-bold tracking-widest uppercase text-black/40 dark:text-white/40">01 — {String(looks.length).padStart(2, '0')}</span>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Runway;
