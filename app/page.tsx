'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Hero from '@/components/Hero';
import ProductGrid from '@/components/ProductGrid';
import Runway from '@/components/Runway';
import CollectionCarousel from '@/components/CollectionCarousel';
import MobileProductGrid from '@/components/MobileProductGrid';
import Newsletter from '@/components/Newsletter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useProducts } from '@/hooks/useProducts';

export default function HomePage() {
    const { data: products } = useProducts();
    const trending = products.filter((p) => p.trending);

    return (
        <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white pb-20 lg:pb-0 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
            <Navbar />
            <Hero />

            {/* Desktop Runway (hidden on mobile) */}
            <div className="hidden lg:block">
                <Runway />
            </div>


            {/* Mobile-only 2x2 product grid above the carousel */}
            <MobileProductGrid />

            {/* Collection carousel (replaces the old split layout) */}
            <CollectionCarousel />

            {/* Editorial / Trending */}
            <section className="lg:hidden pt-12 pb-12 lg:py-32 overflow-hidden bg-white dark:bg-black">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Section Header */}
                    <div className="mb-2 lg:mb-20">
                        {/* Desktop Layout */}
                        <div className="hidden lg:flex flex-row justify-between items-end gap-8">
                            <div>
                                <motion.p
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="text-xs font-bold tracking-[0.3em] uppercase text-red-500 mb-4 flex items-center gap-2"
                                >
                                    <span className="w-8 h-[2px] bg-red-500 inline-block" />
                                    Trending Now
                                </motion.p>
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="text-[5.5rem] font-black uppercase tracking-tighter font-display leading-[0.9]"
                                >
                                    What&apos;s Hot
                                    <span className="block text-2xl font-normal tracking-normal normal-case text-black/50 dark:text-white/40 mt-4 max-w-md leading-relaxed">
                                        The pieces everyone&apos;s talking about this season.
                                    </span>
                                </motion.h2>
                            </div>
                            <Link href="/shop" className="group flex items-center justify-center gap-4 text-sm font-bold uppercase tracking-widest hover:text-white hover:bg-black dark:hover:text-black dark:hover:bg-white transition-all duration-300 border border-black/30 dark:border-white/30 px-8 py-4 w-auto">
                                View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="w-full h-[1px] bg-black/10 dark:bg-white/10 mt-3 lg:mt-14" />
                    </div>

                    {/* Magazine Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-12 gap-2 md:gap-4 lg:gap-6">

                        {/* Hero Product (Large Left) */}
                        {trending[0] && (
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="col-span-2 lg:col-span-7 group"
                            >
                                <Link href={`/product/${trending[0].id}`} className="block relative h-[70vh] lg:h-[75vh] overflow-hidden">
                                    <img
                                        src={trending[0].image}
                                        alt={trending[0].name}
                                        className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                                    {/* Index */}
                                    <span className="absolute top-8 left-8 text-[10rem] lg:text-[14rem] font-black leading-none text-white/[0.06] font-display select-none pointer-events-none">
                                        01
                                    </span>

                                    {/* Content */}
                                    <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                                        <div className="flex items-center w-full">
                                            <span className="text-sm md:text-base lg:text-lg tracking-[0.2em] uppercase text-gray-200 font-bold">{trending[0].category}</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )}

                        {/* Row 1 Right: First Secondary Product */}
                        {trending[1] && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="col-span-1 lg:col-span-5 group relative"
                            >
                                <Link href={`/product/${trending[1].id}`} className="block relative aspect-[3/4] lg:aspect-auto h-auto lg:h-[75vh] overflow-hidden">
                                    <img src={trending[1].image} alt={trending[1].name} className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent group-hover:from-black/80 transition-colors duration-500" />
                                    <span className="absolute top-4 right-6 text-6xl lg:text-7xl font-black leading-none text-white/[0.08] font-display select-none pointer-events-none">02</span>
                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                        <div className="flex items-end justify-between">
                                            <div className="flex items-center w-full max-w-[85%]">
                                                <span className="text-xs md:text-sm tracking-[0.2em] uppercase text-gray-300 font-bold">{trending[1].category}</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                                <ArrowRight size={16} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )}

                        {/* Row 2: Three equal products (4+4+4 = 12 cols) */}
                        {trending.slice(2, 5).map((product, i) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: (i + 2) * 0.1 }}
                                className="col-span-1 lg:col-span-4 group relative"
                            >
                                <Link href={`/product/${product.id}`} className="block relative aspect-[3/4] lg:aspect-auto h-auto lg:h-[55vh] overflow-hidden">
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent group-hover:from-black/80 transition-colors duration-500" />
                                    <span className="absolute top-4 right-6 text-6xl lg:text-7xl font-black leading-none text-white/[0.08] font-display select-none pointer-events-none">
                                        {String(i + 3).padStart(2, '0')}
                                    </span>
                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                        <div className="flex items-end justify-between">
                                            <div className="flex items-center w-full max-w-[85%]">
                                                <span className="text-xs md:text-sm tracking-[0.2em] uppercase text-gray-300 font-bold">{product.category}</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                                <ArrowRight size={16} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Product Grid Section */}
            <ProductGrid />

            {/* Newsletter section is global (rendered inside Footer). */}
            <Footer />
        </div>
    );
}
