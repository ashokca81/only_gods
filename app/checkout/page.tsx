'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Loader2, Phone, FileCheck2, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/format';
import { DEFAULT_COD_TERMS, type CodTermsConfig } from '@/lib/codTerms';
import { useCart, cartKey } from '@/buffer/CartContext';
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

interface SavedAddress {
  id: string;
  name: string | null;
  phone: string | null;
  line: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  is_default: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear, ready, removeItem } = useCart();
  const { customer, loading: custLoading } = useCustomer();
  const { openAuthModal } = useUI();
  const [form, setForm] = useState<Form>(empty);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'cod' | 'online'>('cod');

  // Saved addresses (like Amazon/Flipkart)
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saveAddr, setSaveAddr] = useState(true);
  const [makeDefault, setMakeDefault] = useState(false);

  // Cash-on-Delivery Terms gate (content is dashboard-managed)
  const [codTerms, setCodTerms] = useState<CodTermsConfig>(DEFAULT_COD_TERMS);
  const [showTnc, setShowTnc] = useState(false);       // the accept step before a COD order
  const [acceptTnc, setAcceptTnc] = useState(false);   // the checkbox
  const [showTncInfo, setShowTncInfo] = useState(false); // the info popup card

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

  // Fill the checkout form from a saved address (maps `line` → `address`).
  const fillFromAddress = (a: SavedAddress) => {
    setForm((f) => ({
      ...f,
      name: a.name || f.name,
      phone: a.phone || f.phone,
      address: a.line || '',
      city: a.city || '',
      state: a.state || '',
      pincode: a.pincode || '',
    }));
  };

  const selectAddr = (a: SavedAddress) => {
    setSelectedAddrId(a.id);
    setShowNewForm(false);
    setPicking(false);
    fillFromAddress(a);
  };

  const startNewAddr = () => {
    setSelectedAddrId(null);
    setShowNewForm(true);
    setPicking(false);
    setSaveAddr(true);
    setMakeDefault(false);
    setForm((f) => ({ ...empty, name: customer?.name || '', phone: customer?.phone || '', email: f.email }));
  };

  // Load the dashboard-managed COD Terms text once.
  useEffect(() => {
    let alive = true;
    fetch('/api/settings/cod-terms')
      .then((r) => r.json())
      .then((j) => { if (alive && j?.codTerms) setCodTerms(j.codTerms as CodTermsConfig); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

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

  // Load the customer's saved addresses; pre-select the default and auto-fill.
  useEffect(() => {
    if (!customer) return;
    let alive = true;
    fetch('/api/account/addresses')
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const list: SavedAddress[] = Array.isArray(j?.addresses) ? j.addresses : [];
        setAddresses(list);
        if (list.length > 0) {
          const def = list.find((a) => a.is_default) || list[0];
          setSelectedAddrId(def.id);
          setShowNewForm(false);
          fillFromAddress(def);
        } else {
          setShowNewForm(true);
        }
      })
      .catch(() => setShowNewForm(true));
    return () => { alive = false; };
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

  // Actually place the order (after validation / COD terms are accepted).
  const doPlace = async () => {
    setPlacing(true);
    // Save a newly-typed address to the account (non-fatal if it fails).
    if (showNewForm && saveAddr) {
      try {
        await fetch('/api/account/addresses', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(), phone: form.phone.trim(), line: form.address.trim(),
            city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim(),
            is_default: makeDefault,
          }),
        });
      } catch { /* ignore — don't block the order */ }
    }
    if (payMethod === 'online') {
      const opened = await payOnline();
      if (!opened) setPlacing(false);
    } else {
      await placeCOD();
      setPlacing(false);
    }
  };

  const placeOrder = async () => {
    setError(null);
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Please fill name, phone and address.');
      return;
    }
    // Cash on Delivery must accept the Terms & Conditions first.
    if (payMethod === 'cod') {
      setShowTnc(true);
      return;
    }
    await doPlace();
  };

  // Confirm from the COD Terms dialog — only when the box is ticked.
  const confirmCod = async () => {
    if (!acceptTnc) return;
    setShowTnc(false);
    await doPlace();
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="pt-24 lg:pt-32 pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <h1 className="text-3xl lg:text-4xl font-black font-display uppercase tracking-wide mb-10">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16">
              {/* Shipping details */}
              <div>
                {/* Saved addresses — show the chosen one; "Change" opens the full list */}
                {addresses.length > 0 && !showNewForm && (() => {
                  const selectedAddr = addresses.find((a) => a.id === selectedAddrId) || null;

                  // Collapsed: just the selected address with a "Change" link.
                  if (!picking && selectedAddr) {
                    return (
                      <div className="mb-8">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-3">Deliver to</h2>
                        <div className="relative rounded-xl border border-foreground bg-secondary/40 p-4">
                          <button
                            type="button"
                            onClick={() => setPicking(true)}
                            className="absolute top-3 right-4 text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline"
                          >
                            Change
                          </button>
                          <p className="text-sm font-semibold flex items-center gap-2 pr-16">
                            {selectedAddr.name || 'Address'}
                            {selectedAddr.is_default && (
                              <span className="text-[9px] uppercase tracking-wider bg-foreground text-background px-1.5 py-0.5 rounded-[4px]">Default</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{[selectedAddr.line, selectedAddr.city, selectedAddr.state, selectedAddr.pincode].filter(Boolean).join(', ')}</p>
                          {selectedAddr.phone && <p className="text-sm text-muted-foreground mt-0.5">Phone: {selectedAddr.phone}</p>}
                        </div>
                      </div>
                    );
                  }

                  // Expanded: full list to pick from + add new.
                  return (
                    <div className="mb-8">
                      <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-3">Select a delivery address</h2>
                      <div className="space-y-2.5">
                        {addresses.map((a) => {
                          const active = selectedAddrId === a.id;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => selectAddr(a)}
                              className={`w-full text-left rounded-xl border p-4 flex items-start gap-3 transition-colors ${active ? 'border-foreground bg-secondary/40' : 'border-border hover:border-foreground/40'}`}
                            >
                              <span className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${active ? 'border-foreground' : 'border-muted-foreground/40'}`}>
                                {active && <span className="w-2 h-2 rounded-full bg-foreground" />}
                              </span>
                              <div className="flex-1 min-w-0 text-sm">
                                <p className="font-semibold flex items-center gap-2">
                                  {a.name || 'Address'}
                                  {a.is_default && (
                                    <span className="text-[9px] uppercase tracking-wider bg-foreground text-background px-1.5 py-0.5 rounded-[4px]">Default</span>
                                  )}
                                </p>
                                <p className="text-muted-foreground">{[a.line, a.city, a.state, a.pincode].filter(Boolean).join(', ')}</p>
                                {a.phone && <p className="text-muted-foreground text-xs mt-0.5">Phone: {a.phone}</p>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <button type="button" onClick={startNewAddr} className="mt-3 text-sm font-semibold underline underline-offset-4 hover:text-foreground/70">
                        + Add a new address
                      </button>
                    </div>
                  );
                })()}

                {/* New / manual address form */}
                {(addresses.length === 0 || showNewForm) && (
                  <>
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-5">
                      {addresses.length > 0 ? 'New address' : 'Shipping Details'}
                    </h2>
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
                    <label className="flex items-center gap-2 mt-4 text-sm cursor-pointer select-none">
                      <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="h-4 w-4" />
                      Save this address to my account
                    </label>
                    {saveAddr && (
                      <label className="flex items-center gap-2 mt-2 text-sm cursor-pointer select-none">
                        <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="h-4 w-4" />
                        Set as default address
                      </label>
                    )}
                  </>
                )}

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
                        <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                          <p className="font-medium">{formatPrice(i.price * i.quantity)}</p>
                          <button
                            type="button"
                            onClick={() => removeItem(cartKey(i))}
                            aria-label={`Remove ${i.name}`}
                            className="text-muted-foreground hover:text-destructive inline-flex items-center gap-0.5 text-[11px]"
                          >
                            <X size={12} /> Remove
                          </button>
                        </div>
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

      {/* COD Terms accept dialog */}
      {showTnc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !placing && setShowTnc(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-w-md bg-background rounded-2xl border border-border p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowTnc(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={18} /></button>
            <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center mb-4"><FileCheck2 size={20} /></div>
            <h3 className="text-lg font-bold font-display uppercase tracking-wide mb-1">Pay on Delivery</h3>
            <p className="text-sm text-muted-foreground mb-5">Please accept the terms to place your Cash on Delivery order.</p>

            <label className="flex items-start gap-3 cursor-pointer select-none mb-5">
              <input type="checkbox" checked={acceptTnc} onChange={(e) => setAcceptTnc(e.target.checked)} className="h-4 w-4 mt-0.5" />
              <span className="text-sm">
                I accept the{' '}
                <button type="button" onClick={(e) => { e.preventDefault(); setShowTncInfo(true); }} className="font-semibold text-blue-600 underline underline-offset-2">
                  Terms &amp; Conditions
                </button>
              </span>
            </label>

            <button
              onClick={confirmCod}
              disabled={!acceptTnc || placing}
              className="w-full py-3.5 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {placing && <Loader2 size={16} className="animate-spin" />}
              {placing ? 'Processing…' : 'Confirm order'}
            </button>
          </div>
        </div>
      )}

      {/* COD Terms info popup (dashboard-managed content) */}
      {showTncInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowTncInfo(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-lg bg-background rounded-2xl border border-border p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowTncInfo(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={18} /></button>
            <h3 className="text-base font-bold pr-8 mb-3">{codTerms.title}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{codTerms.body}</p>
            <button onClick={() => setShowTncInfo(false)} className="mt-5 w-full py-3 bg-foreground text-background text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-foreground/90">
              Got it
            </button>
          </div>
        </div>
      )}
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
