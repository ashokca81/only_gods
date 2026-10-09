'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/format';
import { useCustomer } from '@/buffer/CustomerContext';
import { useUI } from '@/buffer/UIContext';

interface WishItem { id: string; name: string; price: number; image: string; category: string }

export default function WishlistPage() {
  const { customer, loading, toggleWishlist } = useCustomer();
  const { openAuthModal } = useUI();
  const [items, setItems] = useState<WishItem[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!customer) { setItems([]); setFetched(true); return; }
    fetch('/api/wishlist').then((r) => r.json()).then((j) => { setItems(j.items ?? []); setFetched(true); }).catch(() => setFetched(true));
  }, [customer]);

  const remove = async (pid: string) => {
    await toggleWishlist(pid);
    setItems((w) => w.filter((x) => x.id !== pid));
  };

  if (!loading && !customer) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-32 pb-40 text-center">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6"><Heart size={30} className="text-muted-foreground" /></div>
          <h1 className="text-2xl font-bold font-display uppercase tracking-wider mb-2">Your Favourites</h1>
          <p className="text-muted-foreground mb-8">Log in to save and view your favourite products.</p>
          <button onClick={() => openAuthModal()} className="px-8 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] rounded-[5px]">Login</button>
        </div>
        <Footer />
      </div>
    );
  }

  if (fetched && items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-32 pb-40 text-center">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6"><Heart size={30} className="text-muted-foreground" /></div>
          <h1 className="text-2xl font-bold font-display uppercase tracking-wider mb-2">No Favourites Yet</h1>
          <p className="text-muted-foreground mb-8">Tap the heart on any product to save it here.</p>
          <Link href="/shop" className="px-8 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] rounded-[5px]">Start Shopping</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="pt-24 lg:pt-32 pb-16">
          <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">
            <h1 className="text-3xl lg:text-5xl font-black font-display uppercase tracking-wide mb-8">Favourites <span className="text-lg text-muted-foreground font-medium align-top">({items.length})</span></h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map((p) => (
                <div key={p.id} className="rounded-[5px] border border-border overflow-hidden group">
                  <Link href={`/product/${p.id}`} className="block aspect-[3/4] bg-secondary overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </Link>
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.category}</p>
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-bold text-sm">{formatPrice(Number(p.price))}</span>
                      <button onClick={() => remove(p.id)} title="Remove" className="text-foreground hover:text-destructive"><Heart size={16} fill="currentColor" /></button>
                    </div>
                    <Link href={`/product/${p.id}`} className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-[5px] bg-foreground text-background py-2 text-xs font-bold uppercase tracking-wider">
                      <ShoppingBag size={14} /> View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
