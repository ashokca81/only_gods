'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/format';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const popularSearches = [
    "Shirt", "Formals", "Casuals", "Hoodie", "Jacket"
];

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const { data: products } = useProducts();

    // Live, case-insensitive match across name, category, brand, tags & description.
    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return products
            .filter((p) =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                (p.brand ?? '').toLowerCase().includes(q) ||
                (p.description ?? '').toLowerCase().includes(q) ||
                (p.collections ?? []).some((c) => c.toLowerCase().includes(q))
            )
            .slice(0, 8);
    }, [query, products]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            // Focus input after animation delay
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);

            // Lock body scroll
            document.body.style.overflow = 'hidden';

            return () => {
                clearTimeout(timer);
                document.body.style.overflow = 'unset';
            };
        }
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-xl"
                >
                    {/* Close Button */}
                    <div className="flex justify-end p-6 lg:p-10">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-secondary transition-colors group"
                        >
                            <X size={32} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col items-center pt-20 px-4">
                        <div className="w-full max-w-3xl">
                            {/* Search Input */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                className="relative"
                            >
                                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground" size={32} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-transparent border-b-2 border-border py-4 pl-12 pr-4 text-3xl lg:text-5xl font-bold placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors font-display"
                                />
                            </motion.div>

                            {/* Live results while typing; popular searches when empty */}
                            {query.trim() ? (
                                <div className="mt-8 max-h-[55vh] overflow-y-auto -mx-2 px-2">
                                    {results.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-6">No products match &ldquo;{query.trim()}&rdquo;.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {results.map((p) => (
                                                <Link
                                                    key={p.id}
                                                    href={`/product/${p.id}`}
                                                    onClick={onClose}
                                                    className="flex items-center gap-4 rounded-xl p-2 hover:bg-secondary transition-colors"
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={(p.images && p.images[0]) || p.image} alt={p.name} className="w-14 h-16 rounded-lg object-cover bg-secondary shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{p.category}</p>
                                                        <p className="font-medium truncate">{p.name}</p>
                                                    </div>
                                                    <span className="font-semibold whitespace-nowrap">{formatPrice(p.price)}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="mt-12"
                                >
                                    <div className="flex items-center gap-2 mb-6 text-sm tracking-[0.2em] uppercase text-muted-foreground font-medium">
                                        <TrendingUp size={14} />
                                        <span>Popular Searches</span>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {popularSearches.map((term) => (
                                            <button
                                                key={term}
                                                type="button"
                                                onClick={() => { setQuery(term); inputRef.current?.focus(); }}
                                                className="inline-block px-6 py-3 bg-secondary rounded-full text-sm font-medium hover:bg-foreground hover:text-background transition-all duration-300"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 text-center text-xs tracking-widest text-muted-foreground uppercase opacity-50">
                        Press ESC to close
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SearchOverlay;
