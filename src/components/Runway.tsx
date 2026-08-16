'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const looks = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop",
        title: "Look 01",
        description: "Midnight Velvet // Tokyo"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop",
        title: "Look 02",
        description: "Urban Nomad // Berlin"
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop",
        title: "Look 03",
        description: "Cyber Noir // Seoul"
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1506634572416-48cdfe530110?w=800&h=1200&fit=crop",
        title: "Look 04",
        description: "Desert Storm // LA"
    },
    {
        id: 5,
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=1200&fit=crop",
        title: "Look 05",
        description: "Concrete Jungle // NYC"
    }
];

const RunwayCard = ({ look, className = "" }: { look: any, className?: string }) => (
    <div className={`relative group ${className}`}>
        <Link href="/collections" className="block relative w-full h-full overflow-hidden">
            <img
                src={look.image}
                alt={look.title}
                className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 grayscale group-hover:grayscale-0"
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
                <span className="text-[10px] md:text-xs tracking-[0.2em] font-bold text-white/70 uppercase border border-white/30 px-3 py-1 rounded-full">{look.description}</span>
            </div>
        </Link>
    </div>
);

const Runway = () => {
    // Desktop Scroll Logic
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
    });
    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

    return (
        <>
            {/* MOBILE LAYOUT: Native Horizontal Scroll (Snap) */}
            <section className="lg:hidden pt-2 pb-2 bg-white text-black dark:bg-neutral-950 dark:text-white overflow-hidden">
                {/* Horizontal Scroll Container */}
                <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 gap-4 pb-4">
                    {looks.map((look) => (
                        <div key={look.id} className="snap-center shrink-0 w-[85vw] mx-auto">
                            <RunwayCard look={look} className="aspect-[3/4] rounded-none" />
                        </div>
                    ))}
                    {/* End Card Mobile */}
                    <div className="snap-center shrink-0 w-[85vw] aspect-[3/4] flex items-center justify-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                        <Link href="/collections" className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                                <ArrowUpRight size={24} />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest text-black dark:text-white">View All</span>
                        </Link>
                    </div>
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
                    <motion.div style={{ x }} className="flex h-full items-center pl-[30vw] pr-[10vw] gap-16">
                        {looks.map((look) => (
                            <div key={look.id} className="relative shrink-0 w-[24vw] aspect-[2/3] group">
                                <RunwayCard look={look} className="h-full w-full grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-105" />
                            </div>
                        ))}

                        {/* End Card Desktop */}
                        <div className="shrink-0 w-[20vw] aspect-[2/3] flex items-center justify-center border-l border-black/10 dark:border-white/10 ml-10">
                            <Link href="/collections" className="group flex flex-col items-center gap-8">
                                <div className="w-32 h-32 rounded-full border border-black/20 dark:border-white/20 flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all duration-500">
                                    <ArrowUpRight size={48} className="group-hover:rotate-45 transition-transform duration-500" />
                                </div>
                                <span className="text-2xl font-black uppercase tracking-widest font-display text-black/50 group-hover:text-black dark:text-white/50 dark:group-hover:text-white transition-colors">View Lookbook</span>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Scroll Progress Indicator */}
                    <div className="absolute bottom-10 left-20 right-20 flex items-center gap-8">
                        <span className="text-xs font-bold tracking-widest uppercase text-black/40 dark:text-white/40">Scroll to Explore</span>
                        <div className="h-[1px] bg-black/10 dark:bg-white/10 flex-1 relative overflow-hidden">
                            <motion.div style={{ width: scrollYProgress, scaleX: scrollYProgress }} className="absolute inset-0 bg-red-500 origin-left" />
                        </div>
                        <span className="text-xs font-bold tracking-widest uppercase text-black/40 dark:text-white/40">01 — 05</span>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Runway;
