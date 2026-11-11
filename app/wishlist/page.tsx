'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/format';
import { useCustomer } from '@/buffer/CustomerContext';
import { useUI } from '@/buffer/UIContext';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useProducts } from '@/hooks/useProducts';

export default function WishlistPage() {
  useScrollRestoration();
  const { customer, loading, wishlistIds, wishlistReady, toggleWishlist } = useCustomer();
  const { openAuthModal } = useUI();
  // Favourites = saved ids + the product list the site already has (no extra
  // request) — shows instantly; image = first photo, same as the cards.
  const { data: products, isPlaceholderData } = useProducts();
  const items = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return Array.from(wishlistIds)
      .map((id) => byId.get(id))
      .filter((p): p is (typeof products)[number] => !!p)
      .map((p) => ({ id: p.id, name: p.name, price: p.price, category: p.category, image: (p.images && p.images[0]) || p.image }));
  }, [products, wishlistIds]);
  const fetched = wishlistReady && !isPlaceholderData;

  const remove = (pid: string) => { void toggleWishlist(pid); };

  if (!loading && !customer) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-32 pb-40 text-center">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6"><Heart size={30} className="text-muted-foreground" /></div>
          <h1 className="text-2xl font-bold font-display uppercase tracking-wider mb-2">Gods Love Your Favourites</h1>
          <p className="text-muted-foreground mb-8">Keep the pieces that speak to you.</p>
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
          <h1 className="text-2xl font-bold font-display uppercase tracking-wider mb-2">Gods Love Your Favourites</h1>
          <p className="text-muted-foreground mb-8">Keep the pieces that speak to you.</p>
          <Link href="/shop" className="px-8 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] rounded-[5px]">Explore Collection</Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (!fetched && items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-32 pb-40 text-muted-foreground">
          <Loader2 size={28} className="animate-spin" />
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
          <div className="container mx-auto px-4 lg:px-8">
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
