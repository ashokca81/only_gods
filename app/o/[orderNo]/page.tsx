import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { callRpc } from '@/lib/customer-rpc';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your ONLY GODS order', robots: { index: false, follow: false } };

interface Item {
  product_id: string | null;
  name: string;
  image: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  available: boolean;
}

/** Shipping-label QR target: shows the products in an order (no personal details). */
export default async function OrderQrPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  let items: Item[] | null = null;
  try {
    items = await callRpc<Item[] | null>('order_public_items', { p_order_no: decodeURIComponent(orderNo) });
  } catch {
    items = null;
  }
  if (!items || items.length === 0) notFound();

  // One product → open it straight away.
  if (items.length === 1 && items[0].product_id && items[0].available) {
    redirect(`/product/${encodeURIComponent(items[0].product_id)}`);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 lg:pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2 text-center">Your order</p>
          <h1 className="text-2xl lg:text-3xl font-black font-display uppercase tracking-wide text-center mb-8">
            {items.length} pieces inside
          </h1>
          <div className="space-y-3">
            {items.map((it, i) => {
              const body = (
                <div className="flex items-center gap-4 rounded-[5px] border border-border p-3 hover:border-foreground/40 transition-colors">
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt={it.name} className="w-16 h-20 rounded-[5px] object-cover bg-secondary" />
                  ) : (
                    <div className="w-16 h-20 rounded-[5px] bg-secondary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{it.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[it.size, it.color].filter(Boolean).join(' · ')}{(it.size || it.color) ? ' · ' : ''}Qty {it.quantity}
                    </p>
                  </div>
                  {it.product_id && it.available && <span className="text-xs font-bold uppercase tracking-widest">View →</span>}
                </div>
              );
              return it.product_id && it.available ? (
                <Link key={i} href={`/product/${encodeURIComponent(it.product_id)}`}>{body}</Link>
              ) : (
                <div key={i}>{body}</div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
