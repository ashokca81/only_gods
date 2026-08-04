'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { products } from '@/data/products';
import { motion } from 'framer-motion';

export default function WishlistPage() {
    // Mock Wishlist Data (Taking random 4 products)
    const wishlistItems = products.slice(0, 4);

    if (wishlistItems.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4 pt-32 pb-40 text-center">
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                        <Heart size={32} className="text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold font-display uppercase tracking-wider mb-2">Your Wishlist is Empty</h1>
                    <p className="text-muted-foreground mb-8 max-w-md">Save items you love to your wishlist. Review them anytime and easily move them to your bag.</p>
                    <Link href="/shop" className="px-8 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-foreground/90 transition-colors">
                        Explore Collection
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 lg:pb-0">
            <Navbar />

            <section className="pt-24 lg:pt-32 pb-16">
                <div className="container mx-auto px-4 lg:px-8">

                    <div className="flex items-end justify-between mb-10 lg:mb-16">
                        <div>
                            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Saved Items</p>
                            <h1 className="text-3xl lg:text-5xl font-black text-foreground font-display uppercase tracking-wide">
                                Wishlist <span className="text-lg lg:text-2xl text-muted-foreground font-medium align-top ml-1">({wishlistItems.length})</span>
                            </h1>
                        </div>
                        <Link href="/shop" className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] hover:text-muted-foreground transition-colors group">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Continue Shopping
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                        {wishlistItems.map((product, i) => (
                            <ProductCard key={product.id} product={product} index={i} />
                        ))}
                    </div>

                    {/* Empty State / Call to Action if needed contextually */}
                    {/* <div className="mt-16 py-12 border-t border-border text-center">
                         <p className="text-muted-foreground mb-4">Want to see more?</p>
                         <Link href="/shop" className="inline-block px-8 py-3 bg-secondary text-foreground text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-foreground hover:text-background transition-colors">
                            Continue Shopping
                        </Link>
                    </div> */}

                </div>
            </section>

            <Footer />
        </div>
    );
}
