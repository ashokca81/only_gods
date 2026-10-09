'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Loader2, Phone } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/buffer/CartContext';
import { useCustomer } from '@/buffer/CustomerContext';
import { useUI } from '@/buffer/UIContext';

interface Form {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const empty: Form = {
  name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear, ready } = useCart();
  const { customer, loading: custLoading } = useCustomer();
  const { openAuthModal } = useUI();
  const [form, setForm] = useState<Form>(empty);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'cod' | 'online'>('cod');

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const shipping = subtotal >= 2000 || subtotal === 0 ? 0 : 99;
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const total = Math.max(0, subtotal - discount) + shipping;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCheckingCoupon(true);
    setCouponMsg(null);
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal, phone: form.phone }),
      });
      const j = await res.json();
      if (j?.valid) {
        setCoupon({ code: j.code, discount: Number(j.discount) || 0 });
        setCouponMsg(null);
      } else {
        setCoupon(null);
        setCouponMsg(j?.reason || 'Invalid coupon');
      }
    } catch {
      setCouponMsg('Could not check coupon');
    } finally {
      setCheckingCoupon(false);
    }
  };

  const removeCoupon = () => { setCoupon(null); setCouponInput(''); setCouponMsg(null); };
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Prefill name & phone from the logged-in customer.
  useEffect(() => {
    if (customer) {
      setForm((f) => ({
        ...f,
        name: f.name || customer.name || '',
        phone: f.phone || customer.phone || '',
      }));
    }
  }, [customer]);

  if (ready && items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-32 pb-40">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
            <ShoppingBag size={32} className="text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display uppercase tracking-wider mb-2">Your Cart is Empty</h1>
          <Link href="/shop" className="mt-4 px-8 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] rounded-xl">
            Start Shopping
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Login gate — checkout requires a logged-in customer (mobile OTP).
  if (ready && !custLoading && !customer) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-32 pb-40 text-center">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
            <Phone size={30} className="text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display uppercase tracking-wider mb-2">Login to checkout</h1>
          <p className="text-muted-foreground mb-8 max-w-sm">Please log in with your mobile number to place your order.</p>
          <button onClick={() => openAuthModal()} className="px-8 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] rounded-[5px] hover:bg-foreground/90">
            Login with mobile number
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const customerPayload = () => ({
    name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
    address: form.address.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim(),
  });
  const itemsPayload = () => items.map((i) => ({ id: i.id, quantity: i.quantity, size: i.size, color: i.color }));

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if (typeof window !== 'undefined' && (window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const finishOrder = (data: { order_no?: string; total?: number }) => {
    clear();
    router.push(`/order/${data.order_no}?total=${data.total ?? total}`);
  };

  const placeCOD = async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: customerPayload(), items: itemsPayload(), payment: 'cod', coupon: coupon?.code ?? null }),
    });
    const data = await res.json();
    if (!res.ok) { if (res.status === 401) openAuthModal(); setError(data.error || 'Could not place order.'); return; }
    finishOrder(data);
  };

  const payOnline = async (): Promise<boolean> => {
    const ok = await loadRazorpay();
    if (!ok) { setError('Could not load the payment gateway. Try again.'); return false; }
    const res = await fetch('/api/payment/create-order', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: itemsPayload(), coupon: coupon?.code ?? null }),
    });
    const o = await res.json();
    if (!res.ok) { if (res.status === 401) openAuthModal(); setError(o.error || 'Could not start payment.'); return false; }

    const rzp = new (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } }).Razorpay({
      key: o.keyId,
      order_id: o.razorpayOrderId,
      amount: o.amount,
      currency: 'INR',
      name: 'ONLY GODS',
      description: 'Order payment',
      prefill: { name: form.name.trim(), contact: form.phone.trim(), email: form.email.trim() },
      theme: { color: '#0f172a' },
      handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        setPlacing(true);
        try {
          const vr = await fetch('/api/payment/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...resp, customer: customerPayload(), items: itemsPayload(), coupon: coupon?.code ?? null }),
          });
          const data = await vr.json();
          if (!vr.ok) { setError(data.error || 'Payment verification failed.'); return; }
          finishOrder(data);
        } finally { setPlacing(false); }
      },
      modal: { ondismiss: () => setPlacing(false) },
    });
    rzp.open();
    return true; // modal opened; its handlers manage the placing state
  };

  const placeOrder = async () => {
    setError(null);
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Please fill name, phone and address.');
      return;
    }
    setPlacing(true);
    if (payMethod === 'online') {
      const opened = await payOnline();
      if (!opened) setPlacing(false);
    } else {
      await placeCOD();
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="pt-24 lg:pt-32 pb-16">
          <div className="container mx-auto px-4 lg:px-8 max-w-[1100px]">
            <h1 className="text-3xl lg:text-4xl font-black font-display uppercase tracking-wide mb-10">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16">
              {/* Shipping details */}
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-5">Shipping Details</h2>
                <div className="space-y-4">
                  <Input label="Full name *" value={form.name} onChange={(v) => set('name', v)} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Phone *" value={form.phone} onChange={(v) => set('phone', v)} type="tel" />
                    <Input label="Email (optional)" value={form.email} onChange={(v) => set('email', v)} type="email" />
                  </div>
                  <Input label="Address *" value={form.address} onChange={(v) => set('address', v)} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="City" value={form.city} onChange={(v) => set('city', v)} />
                    <Input label="State" value={form.state} onChange={(v) => set('state', v)} />
                  </div>
                  <Input label="Pincode" value={form.pincode} onChange={(v) => set('pincode', v)} />
                </div>

                <h2 className="text-sm font-bold uppercase tracking-[0.2em] mt-8 mb-3">Payment</h2>
                <div className="flex items-center gap-3 rounded-xl border border-foreground bg-secondary/30 p-4">
                  <input type="radio" checked readOnly className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-bold">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay with cash when your order arrives.</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <div className="lg:sticky lg:top-32 bg-secondary/20 p-6 lg:p-8 rounded-2xl border border-border">
                  <h3 className="text-lg font-bold font-display uppercase tracking-wider mb-6">Order Summary</h3>
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {items.map((i) => (
                      <div key={`${i.id}-${i.size}-${i.color}`} className="flex gap-3 text-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={i.image} alt={i.name} className="w-12 h-14 rounded object-cover bg-secondary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{i.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[i.size, i.color].filter(Boolean).join(' · ')} × {i.quantity}
                          </p>
                        </div>
                        <p className="font-medium whitespace-nowrap">{formatPrice(i.price * i.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  {/* Coupon */}
                  <div className="border-t border-border pt-4 mb-4">
                    {coupon ? (
                      <div className="flex items-center justify-between rounded-[5px] border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <span className="text-sm font-medium text-emerald-700">🎟️ {coupon.code} applied</span>
                        <button onClick={removeCoupon} className="text-xs text-emerald-700 underline">Remove</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                          placeholder="Coupon code"
                          className="flex-1 h-11 px-3 rounded-[5px] border border-border bg-background text-sm uppercase focus:outline-none focus:ring-2 focus:ring-foreground/10"
                        />
                        <button
                          onClick={applyCoupon}
                          disabled={checkingCoupon || !couponInput.trim()}
                          className="shrink-0 px-4 h-11 rounded-[5px] bg-foreground text-background text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                          {checkingCoupon ? '…' : 'Apply'}
                        </button>
                      </div>
                    )}
                    {couponMsg && <p className="text-xs text-red-600 mt-1.5">{couponMsg}</p>}
                  </div>

                  <div className="space-y-3 border-t border-border pt-4">
                    <Row label="Subtotal" value={formatPrice(subtotal)} />
                    {discount > 0 && <Row label={`Discount (${coupon?.code})`} value={`− ${formatPrice(discount)}`} />}
                    <Row label="Shipping" value={shipping === 0 ? 'Free' : formatPrice(shipping)} />
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                      <span>Total</span><span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-[0.2em] font-bold mb-2">Payment</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPayMethod('cod')}
                        className={`rounded-[5px] border px-3 py-3 text-sm font-medium transition-colors ${payMethod === 'cod' ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/50'}`}
                      >
                        💵 Cash on Delivery
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayMethod('online')}
                        className={`rounded-[5px] border px-3 py-3 text-sm font-medium transition-colors ${payMethod === 'online' ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/50'}`}
                      >
                        💳 Pay Online
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

                  <button
                    onClick={placeOrder}
                    disabled={placing}
                    className="w-full mt-5 py-4 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-foreground/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {placing && <Loader2 size={16} className="animate-spin" />}
                    {placing ? 'Processing…' : payMethod === 'online' ? `Pay ${formatPrice(total)}` : 'Place order (COD)'}
                  </button>
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

function Input({
  label, value, onChange, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
