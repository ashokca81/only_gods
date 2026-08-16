'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import Hero from '@/components/Hero';
import ProductGrid from '@/components/ProductGrid';
import CategoryCard from '@/components/CategoryCard';
import Runway from '@/components/Runway';
import Newsletter from '@/components/Newsletter';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { products, categories } from '@/data/products';

export default function HomePage() {
    const trending = products.filter((p) => p.trending);



    return (
        <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white pb-20 lg:pb-0 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
            <Navbar />
            <Hero />

            {/* Desktop Runway (hidden on mobile) */}
            <div className="hidden lg:block">
                <Runway />
            </div>

            {/* Bento Grid Categories */}
            {/* The Collection - Sticky Split Layout */}
            <section className="hidden lg:block relative bg-white dark:bg-black border-b border-black/10 dark:border-white/10">
                <div className="flex flex-col lg:flex-row">
                    {/* Sticky Image (Left) */}
                    <div className="w-full lg:w-1/2 lg:sticky lg:top-0 h-[50vh] lg:h-screen border-r border-black/10 dark:border-white/10 relative overflow-hidden">
                        <img
                            src="/runway-left.png"
                            alt="The Collection"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>

                    {/* Scrollable Categories (Right) */}
                    <div className="w-full lg:w-1/2 flex flex-col">
                        {categories.map((cat, i) => (
                            <div key={cat.name} className="h-[60vh] lg:h-[80vh] w-full border-b border-black/10 dark:border-white/10 last:border-b-0 relative group">
                                <CategoryCard
                                    {...cat}
                                    index={i}
                                    className="h-full w-full"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Editorial / Trending */}
            <section className="lg:hidden pt-12 pb-12 lg:py-32 overflow-hidden bg-white dark:bg-black">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Section Header */}
                    <div className="mb-2 lg:mb-20">
                        {/* Mobile Layout */}
                        <div className="flex flex-col lg:hidden w-full gap-2">
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="text-[10px] font-bold tracking-[0.3em] uppercase text-red-500 mb-1 flex items-center gap-2"
                            >
                                <span className="w-6 h-[2px] bg-red-500 inline-block" />
                                Trending Now
                            </motion.p>
                            
                            <div className="flex flex-row justify-between items-center w-full">
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="text-[2rem] leading-none sm:text-4xl font-black uppercase tracking-tighter font-display"
                                >
                                    What&apos;s Hot
                                </motion.h2>
                                <Link href="/shop" className="group shrink-0 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-white hover:bg-black dark:hover:text-black dark:hover:bg-white transition-all duration-300 border border-black/30 dark:border-white/30 px-3 py-2 w-auto">
                                    View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            
                            <span className="block text-xs text-black/50 dark:text-white/40 mt-1 max-w-[80%] leading-relaxed">
                                The pieces everyone&apos;s talking about this season.
                            </span>
                        </div>

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

                    {/* Mobile Runway (hidden on desktop) */}
                    <div className="lg:hidden mb-4 mt-2 -mx-4">
                        <Runway />
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

            {/* Newsletter Parallax or Bold Section */}
            <section className="py-32 bg-black text-white dark:bg-white dark:text-black text-center px-4">
                <div className="max-w-xl mx-auto">
                    <Star className="w-12 h-12 mx-auto mb-6 text-white dark:text-black" fill="currentColor" />
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6 font-display">
                        Join the Cult
                    </h2>
                    <p className="text-lg text-white/60 dark:text-black/60 mb-10">
                        Sign up for exclusive access to drops, limited editions, and private sales.
                    </p>
                    <form className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="email"
                            placeholder="ENTER YOUR EMAIL"
                            className="flex-1 bg-transparent border-b-2 border-white dark:border-black px-4 py-3 text-lg placeholder:text-white/40 dark:placeholder:text-black/40 focus:outline-none focus:border-white dark:focus:border-black transition-colors uppercase font-bold text-center sm:text-left"
                        />
                        <button className="bg-white text-black dark:bg-black dark:text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                            Subscribe
                        </button>
                    </form>
                </div>
            </section>

            <Footer />
        </div>
    );
}
