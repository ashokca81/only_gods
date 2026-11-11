'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useCollectionsState } from '@/hooks/useCollections';
import { Loader2 } from 'lucide-react';
import { inCollection } from '@/lib/collections';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import type { Category } from '@/lib/categories';

const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest'];

export default function ShopPage() {
    useScrollRestoration();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [collection, setCollection] = useState<string | null>(null);
    const { collections: collectionsList, ready: collectionsReady } = useCollectionsState();
    const [sortBy, setSortBy] = useState('Featured');
    const [categories, setCategories] = useState<Category[]>([]); // no demo categories while loading
    const { data: products, isPlaceholderData } = useProducts();

    const activeCol = useMemo(
        () => (collection ? collectionsList.find((c) => c.title === collection) ?? { title: collection, categories: [] as string[] } : null),
        [collection, collectionsList],
    );
    // Same tabs everywhere (All, Formals, Casuals…).
    const categoryFilters = useMemo(() => ['All', ...categories.map((c) => c.name)], [categories]);
    // Inside a collection the tab matching it is highlighted (e.g. FORMALS → Formals), not All.
    const isActiveTab = (cat: string) => {
        if (!activeCol || selectedCategory !== 'All') return selectedCategory === cat;
        if (cat === 'All') return false;
        const c = cat.toLowerCase();
        return c === activeCol.title.toLowerCase() || activeCol.categories.some((x) => x.toLowerCase() === c);
    };
    // Picking a tab leaves the collection view: All → everything, Formals → all formals.
    const pickTab = (cat: string) => {
        if (collection) {
            setCollection(null);
            window.history.replaceState(null, '', '/shop');
        }
        setSelectedCategory(cat);
    };
    const loading = isPlaceholderData || (!!collection && !collectionsReady);
    // Filter tabs stay hidden until we know the final highlight (URL read + categories
    // + collection loaded), then fade in once — no "All" flash before Formals.
    const [paramsRead, setParamsRead] = useState(false);
    const [catsLoaded, setCatsLoaded] = useState(false);
    const tabsReady = paramsRead && catsLoaded && (!collection || collectionsReady);

    // Load dashboard-managed categories; preselect from ?category= / ?collection=.
    useEffect(() => {
        fetch('/api/settings/categories')
            .then((r) => r.json())
            .then((j) => { if (Array.isArray(j?.categories) && j.categories.length) setCategories(j.categories); })
            .catch(() => { /* keep defaults */ })
            .finally(() => setCatsLoaded(true));
        const params = new URLSearchParams(window.location.search);
        const cat = params.get('category');
        if (cat) setSelectedCategory(cat);
        const col = params.get('collection');
        if (col) setCollection(col);
        setParamsRead(true);
    }, []);

    // Filter bar: hide while scrolling down, show again when scrolling up.
    const [filterHidden, setFilterHidden] = useState(false);
    useEffect(() => {
        let last = window.scrollY;
        const onScroll = () => {
            const y = window.scrollY;
            if (y <= 4) setFilterHidden(false);           // at the very top -> shown
            else if (y > last + 3) setFilterHidden(true);  // scrolling down -> hide
            else if (y < last - 3) setFilterHidden(false); // scrolling up -> show
            last = y;
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const filtered = useMemo(() => {
        let items = products;
        // Collection is an independent season-wise filter (mixes all categories).
        if (activeCol) items = items.filter((p) => inCollection(p, activeCol));
        if (selectedCategory !== 'All') items = items.filter((p) => p.category === selectedCategory);
        if (sortBy === 'Price: Low to High') items = [...items].sort((a, b) => a.price - b.price);
        if (sortBy === 'Price: High to Low') items = [...items].sort((a, b) => b.price - a.price);
        if (sortBy === 'Newest') items = [...items].filter((p) => p.newArrival).concat(items.filter((p) => !p.newArrival));
        return items;
    }, [selectedCategory, activeCol, sortBy, products]);

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
                                {collection ? collection : (selectedCategory === 'All' ? 'GODS UNIFORMS' : selectedCategory)}
                            </h1>
                            {collection && (
                                <button
                                    onClick={() => { setCollection(null); setSelectedCategory('All'); window.history.replaceState(null, '', '/shop'); }}
                                    className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-wider bg-secondary hover:bg-accent text-foreground rounded-[5px] px-3 py-1.5"
                                >
                                    Clear collection ✕
                                </button>
                            )}
                        </motion.div>
                    </div>
                </section>

                {/* Filters */}
                <section className={`border-b border-border lg:sticky lg:top-16 bg-background/95 backdrop-blur-md z-30 lg:transition-all lg:duration-300 lg:ease-out ${filterHidden ? 'lg:-translate-y-full lg:opacity-0 lg:pointer-events-none' : 'lg:translate-y-0 lg:opacity-100'}`}>
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="flex items-center justify-between py-4 gap-4 overflow-x-auto">
                            <div className={`flex items-center gap-2 transition-opacity duration-300 ${tabsReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                {categoryFilters.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => pickTab(cat)}
                                        className={`px-4 py-2 text-xs tracking-[0.1em] uppercase font-medium rounded-[5px] whitespace-nowrap transition-all ${isActiveTab(cat)
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
                        {loading ? (
                            <div className="flex justify-center py-24 text-muted-foreground">
                                <Loader2 size={28} className="animate-spin" />
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-muted-foreground mb-8">{filtered.length} products</p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                    {filtered.map((product, i) => (
                                        <ProductCard key={product.id} product={product} index={i} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
