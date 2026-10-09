'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/format';

function Confirmation() {
  const params = useParams();
  const search = useSearchParams();
  const orderNo = params?.orderNo as string;
  const totalParam = search.get('total');
  const total = totalParam ? Number(totalParam) : null;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 pt-32 pb-24">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl lg:text-3xl font-black font-display uppercase tracking-wide mb-2">
            Order Placed!
          </h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your order. We&apos;ll call you on your phone to confirm delivery.
          </p>

          <div className="rounded-2xl border border-border bg-secondary/20 p-6 text-left space-y-3 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order number</span>
              <span className="font-bold">{orderNo}</span>
            </div>
            {total != null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total (COD)</span>
                <span className="font-bold">{formatPrice(total)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium">Cash on Delivery</span>
            </div>
          </div>

          <Link
            href="/shop"
            className="inline-block px-8 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-foreground/90 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense>
      <Confirmation />
    </Suspense>
  );
}
