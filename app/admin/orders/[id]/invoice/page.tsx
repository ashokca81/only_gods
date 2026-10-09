import { redirect } from 'next/navigation';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/format';
import { mergeGst, splitInclusive } from '@/lib/gst';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

const STORE = 'ONLY GODS';
const STORE_ADDR = 'D.No 12-3-45, Governorpet, Vijayawada, Andhra Pradesh - 520002';
const NAVY = '#0f172a';

interface Item { name: string; price: number; quantity: number; size: string | null; color: string | null; hsn: string | null; gst_rate: number | null }

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured) redirect('/admin/login');
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) redirect(`/admin/login?next=/admin/orders/${id}/invoice`);
  const { data: profile } = await supabase!.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/admin/login');

  const [{ data: o }, { data: gstRow }] = await Promise.all([
    supabase!
      .from('orders')
      .select('order_no, customer_name, customer_phone, customer_email, address_line, city, state, pincode, status, payment_method, subtotal, shipping, discount, coupon_code, total, created_at, order_items(name, price, quantity, size, color, hsn, gst_rate)')
      .eq('id', id)
      .single(),
    supabase!.from('settings').select('value').eq('key', 'store_gst').single(),
  ]);

  if (!o) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-500">Order not found.</div>;
  }

  const items = (o.order_items ?? []) as Item[];
  const cod = (o.payment_method || 'cod').toLowerCase() === 'cod';
  const discount = Number(o.discount) || 0;

  // GST (tax-inclusive). Compute only when enabled.
  const gst = mergeGst(gstRow?.value);
  const intraState = (o.state ?? '').trim().toLowerCase() === gst.state.trim().toLowerCase();
  let gstTaxable = 0, gstTotal = 0;
  const gstByRate = new Map<number, number>(); // rate -> tax
  if (gst.enabled) {
    for (const it of items) {
      const line = (Number(it.price) || 0) * (it.quantity || 0);
      const rate = it.gst_rate != null ? Number(it.gst_rate) : gst.default_rate;
      const s = splitInclusive(line, rate);
      gstTaxable += s.taxable;
      gstTotal += s.tax;
      gstByRate.set(rate, (gstByRate.get(rate) ?? 0) + s.tax);
    }
  }
  const money = (n: number) => '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const statusColor: Record<string, string> = {
    pending: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444',
  };
  const sc = statusColor[o.status ?? 'pending'] ?? '#64748b';

  return (
    <div className="inv-root">
      <style>{`
        @media print { @page { size: A4; margin: 12mm; } .no-print { display: none !important; } body { margin: 0; } }
        .inv-root { background: #eef1f5; min-height: 100vh; padding: 32px 16px; font-family: ui-sans-serif, system-ui, sans-serif; color: #1f2937; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .inv, .inv * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      <PrintButton label="Download Invoice (PDF)" />

      <div className="inv" style={{ maxWidth: 800, margin: '0 auto', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 28px', borderBottom: `3px solid ${NAVY}` }}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dark_logo.png" alt={STORE} style={{ height: 38 }} />
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8, maxWidth: 230 }}>{STORE_ADDR}</div>
            {gst.enabled && gst.gstin && <div style={{ fontSize: 11, color: '#374151', marginTop: 4 }}><b>GSTIN:</b> {gst.gstin}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, letterSpacing: 1 }}>{gst.enabled ? 'TAX INVOICE' : 'INVOICE'}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{o.order_no}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', background: `${sc}22`, color: sc, marginTop: 8 }}>{o.status}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, padding: '20px 28px' }}>
          <div style={{ flex: 1, background: '#f7f8fa', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Billed to</div>
            <div style={{ fontWeight: 700 }}>{o.customer_name}</div>
            <div style={{ fontSize: 13, color: '#374151' }}>📞 {o.customer_phone}</div>
            {o.customer_email && <div style={{ fontSize: 13, color: '#374151' }}>✉️ {o.customer_email}</div>}
          </div>
          <div style={{ flex: 1, background: '#f7f8fa', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Ship to</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
              {o.address_line}{o.city ? `, ${o.city}` : ''}{o.state ? `, ${o.state}` : ''}{o.pincode ? ` - ${o.pincode}` : ''}
            </div>
            <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: cod ? '#fff7ed' : '#ecfdf5', color: cod ? '#c2410c' : '#047857', marginTop: 8 }}>
              {cod ? 'Cash on Delivery' : 'Prepaid'}
            </span>
          </div>
        </div>

        <div style={{ padding: '0 28px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: NAVY, color: '#fff' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Item</th>
                {gst.enabled && <th style={{ textAlign: 'center', padding: '10px 12px' }}>HSN</th>}
                <th style={{ textAlign: 'center', padding: '10px 12px' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '10px 12px' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '10px 12px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} style={{ background: i % 2 ? '#f7f8fa' : '#fff' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600 }}>{it.name}</div>
                    {(it.size || it.color) && <div style={{ fontSize: 11, color: '#6b7280' }}>{[it.color, it.size].filter(Boolean).join(' · ')}</div>}
                  </td>
                  {gst.enabled && <td style={{ textAlign: 'center', padding: '10px 12px', color: '#6b7280' }}>{it.hsn || '—'}</td>}
                  <td style={{ textAlign: 'center', padding: '10px 12px' }}>{it.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '10px 12px' }}>{formatPrice(Number(it.price))}</td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 600 }}>{formatPrice(Number(it.price) * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 28px 8px' }}>
          <div style={{ width: 280, fontSize: 13 }}>
            <Row label="Subtotal" value={formatPrice(Number(o.subtotal))} />
            {discount > 0 && <Row label={`Discount${o.coupon_code ? ` (${o.coupon_code})` : ''}`} value={`- ${formatPrice(discount)}`} color="#059669" />}
            {gst.enabled && (
              <>
                <Row label="Taxable value" value={money(gstTaxable)} />
                {[...gstByRate.entries()].sort((a, b) => a[0] - b[0]).map(([rate, tax]) => (
                  intraState ? (
                    <div key={rate}>
                      <Row label={`CGST @ ${rate / 2}%`} value={money(tax / 2)} />
                      <Row label={`SGST @ ${rate / 2}%`} value={money(tax / 2)} />
                    </div>
                  ) : (
                    <Row key={rate} label={`IGST @ ${rate}%`} value={money(tax)} />
                  )
                ))}
              </>
            )}
            <Row label="Shipping" value={Number(o.shipping) === 0 ? 'Free' : formatPrice(Number(o.shipping))} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '12px 14px', background: NAVY, color: '#fff', borderRadius: 8, fontWeight: 800, fontSize: 16 }}>
              <span>TOTAL</span><span>{formatPrice(Number(o.total))}</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '18px 28px 26px', borderTop: '1px solid #eef1f5', marginTop: 10 }}>
          <div style={{ fontWeight: 700, color: NAVY }}>Thank you for shopping with {STORE}!</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{STORE_ADDR}</div>
          {gst.enabled && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>Place of supply: {o.state || '—'} · Prices are inclusive of GST.</div>}
          <div style={{ fontSize: 10, color: '#c0c4cc', marginTop: 4 }}>This is a computer-generated invoice.</div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
      <span style={{ color: color ?? '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 600, color: color ?? '#374151' }}>{value}</span>
    </div>
  );
}
