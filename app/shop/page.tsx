'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { DEFAULT_CATEGORIES, type Category } from '@/lib/categories';

const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest'];

export default function ShopPage() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [collection, setCollection] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState('Featured');
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const { data: products } = useProducts();

    const categoryFilters = useMemo(() => ['All', ...categories.map((c) => c.name)], [categories]);

    // Load dashboard-managed categories; preselect from ?category= / ?collection=.
    useEffect(() => {
        fetch('/api/settings/categories')
            .then((r) => r.json())
            .then((j) => { if (Array.isArray(j?.categories) && j.categories.length) setCategories(j.categories); })
            .catch(() => { /* keep defaults */ });
        const params = new URLSearchParams(window.location.search);
        const cat = params.get('category');
        if (cat) setSelectedCategory(cat);
        const col = params.get('collection');
        if (col) setCollection(col);
    }, []);

    const filtered = useMemo(() => {
        let items = products;
        // Collection is an independent season-wise filter (mixes all categories).
        if (collection) items = items.filter((p) => (p.collections ?? []).includes(collection));
        if (selectedCategory !== 'All') items = items.filter((p) => p.category === selectedCategory);
        if (sortBy === 'Price: Low to High') items = [...items].sort((a, b) => a.price - b.price);
        if (sortBy === 'Price: High to Low') items = [...items].sort((a, b) => b.price - a.price);
        if (sortBy === 'Newest') items = [...items].filter((p) => p.newArrival).concat(items.filter((p) => !p.newArrival));
        return items;
    }, [selectedCategory, collection, sortBy, products]);

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
                            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">{collection ? 'Collection' : 'Shop'}</p>
                            <h1 className="text-4xl lg:text-6xl font-bold text-foreground font-display">
                                {collection ? collection : (selectedCategory === 'All' ? 'All Products' : selectedCategory)}
                            </h1>
                            {collection && (
                                <button
                                    onClick={() => setCollection(null)}
                                    className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-wider bg-secondary hover:bg-accent text-foreground rounded-[5px] px-3 py-1.5"
                                >
                                    Clear collection ✕
                                </button>
                            )}
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
