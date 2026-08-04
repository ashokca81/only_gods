'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const popularSearches = [
    "Oversized Tee", "Bomber Jacket", "Cargo Pants", "Silk Shirt", "Accessories"
];

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (isOpen) {
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

                            {/* Popular Searches */}
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
                                    {popularSearches.map((term, index) => (
                                        <motion.div
                                            key={term}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 + index * 0.05 }}
                                        >
                                            <Link
                                                href={`/shop?search=${term}`}
                                                onClick={onClose}
                                                className="inline-block px-6 py-3 bg-secondary rounded-full text-sm font-medium hover:bg-foreground hover:text-background transition-all duration-300"
                                            >
                                                {term}
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
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
