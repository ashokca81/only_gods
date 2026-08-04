'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Minus, Plus, X, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { products } from '@/data/products';

export default function CartPage() {
    // Mock Cart Data (Taking first 2 products for demo)
    const [cartItems, setCartItems] = useState([
        {
            ...products[0],
            quantity: 1,
            selectedSize: 'L',
            selectedColor: 'Black'
        },
        {
            ...products[2],
            quantity: 2,
            selectedSize: 'M',
            selectedColor: 'Charcoal'
        }
    ]);

    const updateQuantity = (id: string, delta: number) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = subtotal > 200 ? 0 : 20; // Free shipping over 200
    const total = subtotal + shipping;

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4 pt-32 pb-40">
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                        <ShoppingBag size={32} className="text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold font-display uppercase tracking-wider mb-2 text-center">Your Cart is Empty</h1>
                    <p className="text-muted-foreground mb-8 text-center max-w-md">Looks like you haven't added anything yet.</p>
                    <Link href="/shop" className="px-8 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-foreground/90 transition-colors">
                        Start Shopping
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 lg:pb-0 flex flex-col">
            <Navbar />

            <main className="flex-1">
                <section className="pt-24 lg:pt-32 pb-16">
                    <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">

                        <div className="flex items-end justify-between mb-10 lg:mb-16">
                            <h1 className="text-3xl lg:text-5xl font-black text-foreground font-display uppercase tracking-wide">
                                Your Bag <span className="text-lg lg:text-2xl text-muted-foreground font-medium align-top ml-1">({cartItems.length})</span>
                            </h1>
                            <Link href="/shop" className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] hover:text-muted-foreground transition-colors group">
                                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                Continue Shopping
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10 lg:gap-20">
                            {/* Cart Items List */}
                            <div className="space-y-6 lg:space-y-10">
                                {cartItems.map((item) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={`${item.id}-${item.selectedSize}`}
                                        className="flex gap-4 lg:gap-8 border-b border-border pb-6 lg:pb-10 last:border-0"
                                    >
                                        {/* Image */}
                                        <Link href={`/product/${item.id}`} className="block w-24 lg:w-40 aspect-[3/4] rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </Link>

                                        {/* Info */}
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">{item.category}</p>
                                                    <Link href={`/product/${item.id}`}>
                                                        <h3 className="text-base lg:text-xl font-bold font-display uppercase hover:text-muted-foreground transition-colors">{item.name}</h3>
                                                    </Link>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            <p className="text-sm font-semibold mb-4">₹{item.price}</p>

                                            <div className="text-xs text-muted-foreground space-y-1 mb-auto">
                                                <p>Size: <span className="text-foreground font-medium">{item.selectedSize}</span></p>
                                                <p>Color: <span className="text-foreground font-medium">{item.selectedColor}</span></p>
                                            </div>

                                            {/* Quantity & Total for Item */}
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="inline-flex items-center border border-border rounded-lg h-9">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="w-9 h-full flex items-center justify-center hover:bg-secondary transition-colors rounded-l-lg"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-10 text-center text-xs font-bold">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="w-9 h-full flex items-center justify-center hover:bg-secondary transition-colors rounded-r-lg"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <p className="text-sm font-bold">₹{item.price * item.quantity}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="relative">
                                <div className="lg:sticky lg:top-32 bg-secondary/20 p-6 lg:p-8 rounded-2xl border border-border">
                                    <h3 className="text-lg font-bold font-display uppercase tracking-wider mb-6">Order Summary</h3>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="font-medium">₹{subtotal}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Shipping</span>
                                            <span className="font-medium">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                                        </div>
                                        <div className="border-t border-border pt-4 flex justify-between text-lg font-bold items-end">
                                            <span>Total</span>
                                            <div className="text-right">
                                                <span className="block text-[10px] text-muted-foreground font-normal mb-1">Including Taxes</span>
                                                <span>₹{total}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Promo Code"
                                                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
                                            />
                                            <button className="px-4 py-3 bg-secondary border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors">
                                                Apply
                                            </button>
                                        </div>
                                    </div>

                                    <button className="w-full py-4 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 group">
                                        Checkout
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>

                                    <div className="mt-6 flex items-center justify-center gap-3 text-muted-foreground opacity-60">
                                        {/* Simple icons for cards */}
                                        <div className="h-6 w-9 bg-foreground/10 rounded"></div>
                                        <div className="h-6 w-9 bg-foreground/10 rounded"></div>
                                        <div className="h-6 w-9 bg-foreground/10 rounded"></div>
                                    </div>
                                    <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-wider">Secure Checkout</p>
                                </div>
                            </div>

                        </div>

                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
