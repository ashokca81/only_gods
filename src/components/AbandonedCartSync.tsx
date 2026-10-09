'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/buffer/CartContext';
import { useCustomer } from '@/buffer/CustomerContext';

/**
 * When a logged-in customer's cart changes, persist a snapshot server-side so
 * the admin can see & recover abandoned carts. Debounced; guests are ignored.
 * Must render inside both CartProvider and CustomerProvider.
 */
export default function AbandonedCartSync() {
  const { items, subtotal, ready } = useCart();
  const { customer } = useCustomer();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready || !customer) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, name: i.name, image: i.image, price: i.price, size: i.size, color: i.color, quantity: i.quantity })),
          subtotal,
        }),
      }).catch(() => {});
    }, 1500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [items, subtotal, customer, ready]);

  return null;
}
