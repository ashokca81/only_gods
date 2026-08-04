'use client';

import { useState, useMemo } from 'react';
import type { Metadata } from 'next';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { products } from '@/data/products';

const categoryFilters = ['All', 'T-Shirts', 'Shirts', 'Hoodies', 'Jeans', 'Accessories'];
const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest'];

export default function ShopPage() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('Featured');

    const filtered = useMemo(() => {
        let items = selectedCategory === 'All' ? products : products.filter((p) => p.category === selectedCategory);
        if (sortBy === 'Price: Low to High') items = [...items].sort((a, b) => a.price - b.price);
        if (sortBy === 'Price: High to Low') items = [...items].sort((a, b) => b.price - a.price);
        if (sortBy === 'Newest') items = [...items].filter((p) => p.newArrival).concat(items.filter((p) => !p.newArrival));
        return items;
    }, [selectedCategory, sortBy]);

    return (
        <div className="min-h-screen bg-background pb-20 lg:pb-0 flex flex-col">
            <Navbar />

            <main className="flex-1">
                {/* Header */}
                <section className="pt-24 pb-8 lg:pt-32 lg:pb-12">
                    <div className="container mx-auto px-4 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center"
                        >
                            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Collection</p>
                            <h1 className="text-4xl lg:text-6xl font-bold text-foreground font-display">
                                {selectedCategory === 'All' ? 'All Products' : selectedCategory}
                            </h1>
                        </motion.div>
                    </div>
                </section>

                {/* Filters */}
                <section className="border-b border-border sticky top-16 lg:top-20 bg-background/95 backdrop-blur-md z-30">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="flex items-center justify-between py-4 gap-4 overflow-x-auto">
                            <div className="flex items-center gap-2">
                                {categoryFilters.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 text-xs tracking-[0.1em] uppercase font-medium rounded-[5px] whitespace-nowrap transition-all ${selectedCategory === cat
                                            ? 'bg-foreground text-background'
                                            : 'bg-secondary text-foreground hover:bg-accent'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-xs tracking-[0.1em] uppercase bg-transparent border border-border rounded-[5px] px-4 py-2 focus:outline-none"
                            >
                                {sortOptions.map((opt) => (
                                    <option key={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Product Grid */}
                <section className="py-12 lg:py-16">
                    <div className="container mx-auto px-4 lg:px-8">
                        <p className="text-xs text-muted-foreground mb-8">{filtered.length} products</p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {filtered.map((product, i) => (
                                <ProductCard key={product.id} product={product} index={i} />
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
