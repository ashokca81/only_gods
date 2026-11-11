'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface Customer {
  id: string;
  phone: string;
  name: string | null;
  avatar_url: string | null;
}

interface CustomerContextType {
  customer: Customer | null;
  loading: boolean;
  setCustomer: (c: Customer | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  wishlistIds: Set<string>;
  wishlistReady: boolean; // ids known (from this device's cache or the server)
  isWishlisted: (pid: string) => boolean;
  toggleWishlist: (pid: string) => Promise<'added' | 'removed' | 'login'>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIdsState] = useState<Set<string>>(new Set());
  const [wishlistReady, setWishlistReady] = useState(false);

  // Remember favourite ids on this device so the Favourites page paints instantly.
  const WL_KEY = 'og_wishlist_ids';
  const setWishlistIds = useCallback((v: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setWishlistIdsState((prev) => {
      const next = typeof v === 'function' ? v(prev) : v;
      try { localStorage.setItem(WL_KEY, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WL_KEY);
      if (raw) { setWishlistIdsState(new Set(JSON.parse(raw) as string[])); setWishlistReady(true); }
    } catch { /* ignore */ }
  }, []);

  const loadWishlist = useCallback(async () => {
    try {
      const r = await fetch('/api/wishlist?ids=1');
      const j = await r.json();
      setWishlistIds(new Set((j.items ?? []).map((p: { id: string }) => p.id)));
    } catch {
      /* keep what we have */
    } finally {
      setWishlistReady(true);
    }
  }, [setWishlistIds]);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me');
      const j = await r.json();
      setCustomer(j.customer ?? null);
      setLoading(false); // don't hold the UI for the wishlist
      if (j.customer) await loadWishlist();
      else { setWishlistIds(new Set()); setWishlistReady(true); }
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [loadWishlist, setWishlistIds]);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCustomer(null);
    setWishlistIds(new Set());
  }, [setWishlistIds]);

  const isWishlisted = useCallback((pid: string) => wishlistIds.has(pid), [wishlistIds]);

  const toggleWishlist = useCallback(async (pid: string): Promise<'added' | 'removed' | 'login'> => {
    const r = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: pid }),
    });
    if (r.status === 401) return 'login';
    const j = await r.json();
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (j.in_wishlist) next.add(pid);
      else next.delete(pid);
      return next;
    });
    return j.in_wishlist ? 'added' : 'removed';
  }, [setWishlistIds]);

  return (
    <CustomerContext.Provider
      value={{ customer, loading, setCustomer, refresh, logout, wishlistIds, wishlistReady, isWishlisted, toggleWishlist }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export const useCustomer = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
};
