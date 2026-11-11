'use client';

import { useEffect } from 'react';
import { useCart } from '@/buffer/CartContext';
import { useCustomer } from '@/buffer/CustomerContext';

export const PENDING_PAYU_KEY = 'og_pending_payu';

/**
 * After an online payment the customer may never come back through the order
 * page (tab closed, app switched). On the next visit, ask the server whether
 * that payment went through and, if so, empty the cart that was just bought.
 */
export default function PendingPaymentCheck() {
  const { clear, ready } = useCart();
  const { customer } = useCustomer();

  useEffect(() => {
    if (!ready || !customer) return;
    let pending: { txnid?: string; at?: number } | null = null;
    try { pending = JSON.parse(localStorage.getItem(PENDING_PAYU_KEY) || 'null'); } catch { /* ignore */ }
    if (!pending?.txnid) return;
    if (Date.now() - (pending.at ?? 0) > 3 * 24 * 3600 * 1000) { localStorage.removeItem(PENDING_PAYU_KEY); return; }
    fetch(`/api/payment/payu/status?txnid=${encodeURIComponent(pending.txnid)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.status === 'paid') { clear(); localStorage.removeItem(PENDING_PAYU_KEY); }
        else if (j?.status === 'failed') localStorage.removeItem(PENDING_PAYU_KEY);
      })
      .catch(() => { /* try again next visit */ });
  }, [ready, customer, clear]);

  return null;
}
