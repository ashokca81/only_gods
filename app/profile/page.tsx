'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, Camera, Trash2, Plus, Package, MapPin, Heart, User, Check, Phone, Pencil } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatPrice } from '@/lib/format';
import { useCustomer } from '@/buffer/CustomerContext';
import { useUI } from '@/buffer/UIContext';
import { toast } from 'sonner';

interface OrderItem { name: string; image: string | null; price: number; quantity: number; size: string | null; color: string | null }
interface Order { id: string; order_no: string; status: string; total: number; created_at: string; items: OrderItem[]; courier?: string | null; tracking_number?: string | null; tracking_url?: string | null; payment_status?: string | null; return_status?: string | null }

const RETURN_REASONS = ['Damaged item', 'Wrong item received', 'Size / fit issue', 'Not as described', 'Changed my mind', 'Other'];

const TRACK_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'] as const;
const STEP_LABEL: Record<string, string> = { pending: 'Ordered', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered' };

// Always open the courier link as an external URL — if the admin typed it
// without a scheme (e.g. "track.xyz.com"), the browser would otherwise treat
// it as an in-site relative path and land on the wrong page.
const trackHref = (u?: string | null): string | null => {
  const t = (u ?? '').trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};
interface Address { id: string; name: string | null; phone: string | null; line: string; city: string | null; state: string | null; pincode: string | null; is_default: boolean }
interface WishItem { id: string; name: string; price: number; image: string; category: string }

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-violet-100 text-violet-700', delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-neutral-200 text-neutral-500',
};

export default function ProfilePage() {
  const router = useRouter();
  const { customer, loading, setCustomer, logout } = useCustomer();
  const { openAuthModal } = useUI();

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<WishItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showAddr, setShowAddr] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const blankAddr = { name: '', phone: '', line: '', city: '', state: '', pincode: '', is_default: false };
  const [addr, setAddr] = useState(blankAddr);

  // Return request
  const [returnFor, setReturnFor] = useState<Order | null>(null);
  const [retReason, setRetReason] = useState('');
  const [retComment, setRetComment] = useState('');
  const [retBusy, setRetBusy] = useState(false);

  const submitReturn = async () => {
    if (!returnFor) return;
    if (!retReason) { toast.error('Please choose a reason'); return; }
    setRetBusy(true);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: returnFor.id, reason: retReason, comment: retComment }),
      });
      const j = await res.json();
      if (!res.ok) { toast.error(j?.error || 'Could not submit'); return; }
      toast.success('Return request submitted');
      setOrders((prev) => prev.map((o) => (o.id === returnFor.id ? { ...o, return_status: j.status || 'requested' } : o)));
      setReturnFor(null); setRetReason(''); setRetComment('');
    } finally { setRetBusy(false); }
  };

  const loadAll = useCallback(async () => {
    const [o, a, w] = await Promise.all([
      fetch('/api/account/orders').then((r) => r.json()).catch(() => ({ orders: [] })),
      fetch('/api/account/addresses').then((r) => r.json()).catch(() => ({ addresses: [] })),
      fetch('/api/wishlist').then((r) => r.json()).catch(() => ({ items: [] })),
    ]);
    setOrders(o.orders ?? []);
    setAddresses(a.addresses ?? []);
    setWishlist(w.items ?? []);
  }, []);

  useEffect(() => { if (customer) loadAll(); }, [customer, loadAll]);

  if (!loading && !customer) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-32 pb-40 text-center">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6"><User size={30} className="text-muted-foreground" /></div>
          <h1 className="text-2xl font-bold font-display uppercase tracking-wider mb-2">Your Account</h1>
          <p className="text-muted-foreground mb-8">Log in with your mobile number to view your profile.</p>
          <button onClick={() => openAuthModal()} className="px-8 py-3 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] rounded-[5px]">Login</button>
        </div>
        <Footer />
      </div>
    );
  }

  const initials = (customer?.name || customer?.phone || '?').slice(0, 1).toUpperCase();

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await fetch('/api/account/avatar', { method: 'POST', body: fd });
      const j = await r.json();
      if (r.ok) setCustomer(j.customer);
    } finally { setUploading(false); }
  };

  const saveName = async () => {
    const r = await fetch('/api/account/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nameInput.trim() }) });
    const j = await r.json();
    if (r.ok) { setCustomer(j.customer); setEditingName(false); }
  };

  const openAddAddr = () => { setEditingId(null); setAddr(blankAddr); setShowAddr(true); };
  const editAddress = (a: Address) => {
    setEditingId(a.id);
    setAddr({ name: a.name ?? '', phone: a.phone ?? '', line: a.line, city: a.city ?? '', state: a.state ?? '', pincode: a.pincode ?? '', is_default: a.is_default });
    setShowAddr(true);
  };
  const saveAddress = async () => {
    if (!addr.line.trim()) return;
    const r = await fetch('/api/account/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addr) });
    const j = await r.json();
    if (!r.ok) return;
    // Editing = replace the old row (backend only inserts, so drop the previous one).
    if (editingId) {
      const d = await fetch(`/api/account/addresses?id=${editingId}`, { method: 'DELETE' });
      const dj = await d.json();
      setAddresses((d.ok ? dj.addresses : j.addresses) ?? []);
    } else {
      setAddresses(j.addresses ?? []);
    }
    setAddr(blankAddr); setShowAddr(false); setEditingId(null);
  };
  const deleteAddress = async (id: string) => {
    const r = await fetch(`/api/account/addresses?id=${id}`, { method: 'DELETE' });
    const j = await r.json();
    if (r.ok) setAddresses(j.addresses ?? []);
    setShowAddr(false); setEditingId(null);
  };
  const removeWish = async (pid: string) => {
    await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: pid }) });
    setWishlist((w) => w.filter((x) => x.id !== pid));
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="pt-24 lg:pt-32 pb-16">
          <div className="container mx-auto px-0 sm:px-4 lg:px-8 max-w-[1180px] space-y-4 sm:space-y-6">

            {/* Profile header */}
            <div className="rounded-none sm:rounded-2xl border-y sm:border border-border bg-gradient-to-r from-secondary/50 via-secondary/20 to-transparent p-4 sm:p-6 lg:p-7 flex flex-row items-center gap-3 sm:gap-5">
              <div className="relative shrink-0">
                <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full ring-2 ring-amber-400/70 ring-offset-2 ring-offset-background bg-foreground text-background flex items-center justify-center text-xl sm:text-2xl font-bold overflow-hidden">
                  {customer?.avatar_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={customer.avatar_url} alt="" className="h-full w-full object-cover" />
                    : initials}
                </div>
                <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center cursor-pointer border-2 border-background">
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                  <input type="file" accept="image/*" className="hidden" onChange={onAvatar} disabled={uploading} />
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-1">Welcome back</p>
                {editingName ? (
                  <div className="flex items-center gap-2 max-w-sm">
                    <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Your name"
                      className="flex-1 bg-background border border-border rounded-[5px] px-3 py-1.5 text-sm" />
                    <button onClick={saveName} className="rounded-[5px] bg-foreground text-background px-3 py-1.5 text-xs font-bold">Save</button>
                  </div>
                ) : (
                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight flex items-center gap-2 sm:gap-2.5 truncate">
                    {customer?.name || 'Add your name'}
                    <button onClick={() => { setNameInput(customer?.name || ''); setEditingName(true); }} className="text-muted-foreground/60 hover:text-foreground shrink-0"><Pencil size={14} /></button>
                  </h1>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-1.5 flex items-center gap-1.5"><Phone size={12} className="shrink-0" /> +91 {customer?.phone}</p>
              </div>
              <button onClick={async () => { await logout(); router.push('/'); }} className="shrink-0 inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-foreground text-background px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90">
                <LogOut size={14} /> Logout
              </button>
            </div>

            {/* Two-column body */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 items-start">

              {/* Orders */}
              <div className="rounded-none sm:rounded-2xl border-y sm:border border-border bg-background p-5 lg:p-6">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-5"><Package size={16} /> My Orders ({orders.length})</h2>
                {orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : (
                  <div className="space-y-3">
                    {orders.map((o) => {
                      const idx = TRACK_STEPS.indexOf(o.status as typeof TRACK_STEPS[number]);
                      const cur = idx < 0 ? 0 : idx;
                      const cancelled = o.status === 'cancelled';
                      return (
                        <div key={o.id} className="rounded-xl border border-border p-4 hover:border-foreground/30 transition-colors">
                          <div className="flex gap-4">
                            {/* thumbnail */}
                            {o.items?.[0]?.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={o.items[0].image} alt="" className="h-16 w-14 rounded-lg object-cover bg-secondary shrink-0" />
                            ) : <div className="h-16 w-14 rounded-lg bg-secondary shrink-0" />}

                            {/* middle: info + tracker */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{o.order_no}</p>
                              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {o.items?.length ?? 0} item(s)</p>

                              {!cancelled ? (
                                <div className="mt-3 flex items-center max-w-md">
                                  {TRACK_STEPS.map((s, i) => (
                                    <div key={s} className="flex items-center flex-1 last:flex-none">
                                      <div className="flex flex-col items-center">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${i <= cur ? 'bg-foreground text-background' : 'bg-secondary text-transparent border border-border'}`}>
                                          <Check size={12} strokeWidth={3} />
                                        </div>
                                        <span className={`text-[9px] mt-1 whitespace-nowrap ${i <= cur ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{STEP_LABEL[s]}</span>
                                      </div>
                                      {i < TRACK_STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 -mt-4 ${i < cur ? 'bg-foreground' : 'bg-border'}`} />}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-2 text-xs text-muted-foreground">This order was cancelled.</p>
                              )}
                            </div>

                            {/* right: status + price + action */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle[o.status] ?? 'bg-secondary text-muted-foreground'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{o.status}
                              </span>
                              <span className="font-bold text-sm">{formatPrice(Number(o.total))}</span>
                              {trackHref(o.tracking_url) && !cancelled && (
                                <a href={trackHref(o.tracking_url)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-foreground text-background px-3 py-2 text-xs font-bold tracking-wide">
                                  Track Order →
                                </a>
                              )}
                            </div>
                          </div>

                          {/* shipment info / return row */}
                          {(o.courier || o.tracking_number) && !cancelled && !trackHref(o.tracking_url) && (
                            <p className="mt-3 text-xs text-muted-foreground">
                              {o.courier && <span className="font-medium text-foreground">{o.courier}</span>}{o.tracking_number ? ` · ${o.tracking_number}` : ''}
                            </p>
                          )}
                          {o.return_status ? (
                            <div className="mt-3 inline-block text-xs rounded-lg bg-secondary/60 px-3 py-1.5">
                              <span className="font-medium">Return:</span> <span className="capitalize">{o.return_status}</span>
                            </div>
                          ) : o.status === 'delivered' ? (
                            <button
                              onClick={() => { setReturnFor(o); setRetReason(''); setRetComment(''); }}
                              className="mt-3 inline-flex rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:border-foreground hover:text-foreground"
                            >
                              Request return
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right column: Addresses + Favourites */}
              <div className="space-y-6">
                {/* Addresses */}
                <div className="rounded-none sm:rounded-2xl border-y sm:border border-border bg-background p-5 lg:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider"><MapPin size={16} /> Saved Addresses</h2>
                    <button onClick={openAddAddr} className="inline-flex items-center gap-1 text-xs font-bold rounded-lg bg-amber-500 text-white px-3 py-1.5 hover:bg-amber-600"><Plus size={14} /> Add</button>
                  </div>
                  {showAddr && (
                    <div className="rounded-xl border border-border p-3 mb-3 grid sm:grid-cols-2 gap-2">
                      <input placeholder="Name" value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} className="border border-border rounded-[5px] px-2 py-1.5 text-sm" />
                      <input placeholder="Phone" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} className="border border-border rounded-[5px] px-2 py-1.5 text-sm" />
                      <input placeholder="Address" value={addr.line} onChange={(e) => setAddr({ ...addr, line: e.target.value })} className="border border-border rounded-[5px] px-2 py-1.5 text-sm sm:col-span-2" />
                      <input placeholder="City" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className="border border-border rounded-[5px] px-2 py-1.5 text-sm" />
                      <input placeholder="State" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} className="border border-border rounded-[5px] px-2 py-1.5 text-sm" />
                      <input placeholder="Pincode" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value })} className="border border-border rounded-[5px] px-2 py-1.5 text-sm" />
                      <label className="flex items-center gap-2 text-xs sm:col-span-2"><input type="checkbox" checked={addr.is_default} onChange={(e) => setAddr({ ...addr, is_default: e.target.checked })} /> Set as default</label>
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <button onClick={saveAddress} className="rounded-lg bg-foreground text-background px-4 py-2 text-xs font-bold">{editingId ? 'Update address' : 'Save address'}</button>
                        {editingId && <button onClick={() => deleteAddress(editingId)} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/5">Delete</button>}
                        <button onClick={() => { setShowAddr(false); setEditingId(null); setAddr(blankAddr); }} className="text-xs text-muted-foreground ml-auto">Cancel</button>
                      </div>
                    </div>
                  )}
                  {addresses.length === 0 ? <p className="text-sm text-muted-foreground">No saved addresses.</p> : (
                    <div className="space-y-3">
                      {addresses.map((a) => (
                        <div key={a.id} className="relative rounded-xl border border-border p-4 text-sm">
                          <button onClick={() => editAddress(a)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"><Pencil size={15} /></button>
                          <p className="font-semibold flex items-center gap-2 pr-8">{a.name || 'Address'} {a.is_default && <span className="text-[10px] font-bold bg-secondary rounded-[4px] px-1.5 py-0.5">Default</span>}</p>
                          <p className="text-muted-foreground mt-1.5 leading-relaxed">{a.line}{a.city ? `, ${a.city}` : ''}{a.state ? `, ${a.state}` : ''}{a.pincode ? `, ${a.pincode}` : ''}</p>
                          {a.phone && <p className="text-muted-foreground mt-1.5">{a.phone}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Favourites */}
                <div className="rounded-none sm:rounded-2xl border-y sm:border border-border bg-background p-5 lg:p-6">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4"><Heart size={16} /> Favourites ({wishlist.length})</h2>
                  {wishlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4"><Heart size={26} className="text-muted-foreground" /></div>
                      <p className="font-semibold">No favourites yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Your saved items will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {wishlist.map((p) => (
                        <div key={p.id} className="rounded-xl border border-border overflow-hidden group">
                          <Link href={`/product/${p.id}`} className="block aspect-[3/4] bg-secondary">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          </Link>
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">{p.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-bold">{formatPrice(Number(p.price))}</span>
                              <button onClick={() => removeWish(p.id)} className="text-muted-foreground hover:text-destructive"><Heart size={14} fill="currentColor" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Return request modal */}
      {returnFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !retBusy && setReturnFor(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-w-md bg-background rounded-[5px] border border-border p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-1">Request return</h3>
            <p className="text-xs text-muted-foreground mb-4">Order {returnFor.order_no}</p>
            <div className="space-y-2 mb-3">
              {RETURN_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRetReason(r)}
                  className={`w-full text-left text-sm rounded-[5px] border px-3 py-2 ${retReason === r ? 'border-foreground bg-secondary/50' : 'border-border hover:border-foreground/40'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={retComment}
              onChange={(e) => setRetComment(e.target.value)}
              placeholder="Any details (optional)…"
              rows={2}
              className="w-full border border-border rounded-[5px] px-3 py-2 text-sm resize-none bg-background focus:outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setReturnFor(null)} className="rounded-[5px] border border-border px-4 py-2 text-xs">Cancel</button>
              <button onClick={submitReturn} disabled={retBusy} className="rounded-[5px] bg-foreground text-background px-5 py-2 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 disabled:opacity-60">
                {retBusy && <Loader2 size={14} className="animate-spin" />} Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
