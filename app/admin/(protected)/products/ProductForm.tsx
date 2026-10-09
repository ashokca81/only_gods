'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Upload, Plus, X, Video as VideoIcon, Loader2, Check as CheckIcon, Trash2,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { createProduct, updateProduct, type ProductInput } from './actions';
import type { Variant } from '@/lib/variants';
import InfoCard from '../../_components/InfoCard';

const PALETTE = [
  '#000000', '#ffffff', '#64748b', '#1e293b', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#22c55e', '#10b981', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#78350f', '#a16207',
  '#e5e7eb', '#9ca3af',
];
const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', 'One Size'];

const newVariant = (color: string): Variant => ({
  color, name: '', price: 0, original_price: null, images: [], sizes: [],
});

export default function ProductForm({
  initial,
  productId,
}: {
  initial: ProductInput;
  productId?: string;
}) {
  const router = useRouter();
  // Always keep at least one variant (holds images/price/sizes even without colours).
  const [form, setForm] = useState<ProductInput>(() => ({
    ...initial,
    variants: initial.variants.length > 0 ? initial.variants : [newVariant('')],
  }));
  // Simple product (no colours) vs colour-variant product.
  const [hasColors, setHasColors] = useState<boolean>(
    initial.variants.some((v) => (v.color ?? '').trim() !== '')
  );
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [tagInput, setTagInput] = useState('');
  const [previewIdx, setPreviewIdx] = useState(0);

  // Dashboard-managed categories (shared with Shop filters & Collections page).
  const [cats, setCats] = useState<string[]>([]);
  const [customCat, setCustomCat] = useState(false);
  useEffect(() => {
    fetch('/api/settings/categories')
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j?.categories)) setCats(j.categories.map((c: { name: string }) => c.name));
      })
      .catch(() => { /* ignore */ });
  }, []);
  // Union so an existing product's category always stays selectable.
  const catOptions = Array.from(
    new Set([...cats, ...(form.category.trim() ? [form.category] : [])])
  );

  // Dashboard-managed collections (season-wise groups, multi-select on a product).
  const [collectionList, setCollectionList] = useState<string[]>([]);
  useEffect(() => {
    fetch('/api/settings/collections')
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j?.collections)) setCollectionList(j.collections.map((c: { title: string }) => c.title));
      })
      .catch(() => { /* ignore */ });
  }, []);
  // Union so an already-assigned collection stays visible even if later renamed/removed.
  const collectionOptions = Array.from(new Set([...collectionList, ...form.collections]));
  const toggleCollection = (name: string) =>
    setForm((f) => ({
      ...f,
      collections: f.collections.includes(name)
        ? f.collections.filter((c) => c !== name)
        : [...f.collections, name],
    }));

  // Toggle colour mode. OFF collapses to one colourless variant (keeps its media).
  const toggleHasColors = (on: boolean) => {
    setHasColors(on);
    setPreviewIdx(0);
    if (!on) {
      setForm((f) => ({ ...f, variants: [{ ...(f.variants[0] ?? newVariant('')), color: '' }] }));
    } else {
      setForm((f) => {
        const first = f.variants[0] ?? newVariant('');
        const firstColored = first.color.trim() ? first : { ...first, color: '#000000' };
        return { ...f, variants: [firstColored, ...f.variants.slice(1)] };
      });
    }
  };

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const uploadFile = async (file: File): Promise<string | null> => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Upload failed'); return null; }
      return json.url as string;
    } catch {
      setError('Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const pickVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); e.target.value = '';
    for (const file of files) {
      const url = await uploadFile(file);
      if (url) setForm((f) => ({ ...f, videos: [...f.videos, url] }));
    }
  };

  // ---- variants ----
  const addVariant = (hex: string) => {
    const c = hex.toLowerCase();
    setForm((f) => (f.variants.some((v) => v.color.toLowerCase() === c) ? f : { ...f, variants: [...f.variants, newVariant(c)] }));
  };
  const updateVariant = (idx: number, patch: Partial<Variant>) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)) }));
  const removeVariant = (idx: number) => {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));
    setPreviewIdx(0);
  };

  const addTag = (s: string) => {
    const v = s.trim(); if (!v) return;
    setForm((f) => (f.tags.includes(v) ? f : { ...f, tags: [...f.tags, v] }));
    setTagInput('');
  };

  const save = () => {
    setError(null);
    if (!form.name.trim()) { setError('Product name is required'); return; }
    if (hasColors && form.variants.every((v) => !(v.color ?? '').trim())) {
      setError('Add at least one colour (or turn off colour options)');
      return;
    }
    const variants = hasColors
      ? form.variants
      : [{ ...(form.variants[0] ?? newVariant('')), color: '' }];
    const payload: ProductInput = {
      ...form,
      variants,
      // One bullet per line → clean array (drop blank lines).
      details_care: (form.details_care ?? []).map((s) => s.trim()).filter(Boolean),
      shipping_returns: (form.shipping_returns ?? '')?.toString().trim() || null,
    };
    startSave(async () => {
      const res = productId ? await updateProduct(productId, payload) : await createProduct(payload);
      if (!res.ok) { setError(res.error); return; }
      router.push('/admin/products');
      router.refresh();
    });
  };

  const pv = form.variants[previewIdx] ?? form.variants[0];
  const pvDiscount = pv && pv.original_price && pv.original_price > pv.price
    ? Math.round((1 - pv.price / pv.original_price) * 100) : 0;

  return (
    <div className="max-w-6xl">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="rounded-[5px] p-2 hover:bg-neutral-100 text-neutral-600"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-bold">{productId ? 'Edit product' : 'Add product'}</h1>
            <p className="text-xs text-neutral-500">Each colour has its own photos, price & sizes — the preview updates live.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products" className="rounded-[5px] border border-neutral-200 bg-white px-4 h-10 inline-flex items-center text-sm font-medium hover:bg-neutral-50">Cancel</Link>
          <button onClick={save} disabled={saving || uploading}
            className="rounded-[5px] bg-blue-600 text-white px-5 h-10 inline-flex items-center gap-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Saving…' : productId ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-[5px] border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      <InfoCard
        title="How the Add Product page works"
        intro="Create a product that instantly appears on your website. The left side is the form; the right side is a live preview."
        twoPane={{
          leftTitle: '📝 Form (left side)',
          leftDesc: 'Type details, upload photos/videos, set price, colours, sizes & stock.',
          rightTitle: '👁 Live preview (right side)',
          rightDesc: 'Updates instantly as you type — exactly how customers will see it.',
          caption: 'Edit on the left → watch the result on the right in real time.',
        }}
        flow={['Basic details', 'Photos / video', 'Colours (optional)', 'Price & stock', 'Save → Live on site']}
        steps={[
          { title: 'Basic details', desc: 'Name, brand, category, SKU and description.' },
          { title: 'Images & video', desc: 'Upload product photos; add a video (max 50 MB) that plays on the product page.' },
          { title: 'Colours', desc: 'Turn ON “colour options” to give each colour its own photos, price & sizes. Leave OFF for a simple product.' },
          { title: 'Price, MRP & stock', desc: 'Set price and MRP (discount is auto-calculated). Add each size with its stock quantity.' },
          { title: 'Save', desc: 'Click “Create product” — it appears on your website straight away.' },
        ]}
        note="Keep an eye on the preview on the right while editing — if it looks right there, customers see the same."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* LEFT */}
        <div className="space-y-5">
          <Card title="Basic details">
            <Field label="Product name *">
              <input className="inp" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Black Wildloom Hoodie" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Brand"><input className="inp" value={form.brand ?? ''} onChange={(e) => set('brand', e.target.value || null)} placeholder="ONLY GODS" /></Field>
              <Field label="Category">
                {customCat ? (
                  <input
                    className="inp"
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    placeholder="New category name"
                    autoFocus
                  />
                ) : (
                  <select
                    className="inp"
                    value={form.category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') { setCustomCat(true); set('category', ''); }
                      else set('category', e.target.value);
                    }}
                  >
                    <option value="">Select category…</option>
                    {catOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">+ Custom / new…</option>
                  </select>
                )}
                <div className="flex items-center gap-3 mt-1">
                  {customCat && (
                    <button type="button" onClick={() => { setCustomCat(false); set('category', ''); }} className="text-[11px] text-neutral-500 hover:text-black">
                      ← Pick from list
                    </button>
                  )}
                  <Link href="/admin/categories" target="_blank" className="text-[11px] text-neutral-500 hover:text-black underline">
                    Manage categories
                  </Link>
                </div>
              </Field>

              <Field label="Collections (season groups)">
                <select
                  className="inp"
                  value=""
                  onChange={(e) => { if (e.target.value) toggleCollection(e.target.value); }}
                >
                  <option value="">+ Add collection…</option>
                  {collectionOptions
                    .filter((name) => !form.collections.includes(name))
                    .map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                {form.collections.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.collections.map((name) => (
                      <span key={name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs bg-black text-white">
                        {name}
                        <button type="button" onClick={() => toggleCollection(name)} className="hover:text-red-300" aria-label={`Remove ${name}`}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <Link href="/admin/collections" target="_blank" className="text-[11px] text-neutral-500 hover:text-black underline mt-1 inline-block">
                  Manage collections
                </Link>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="SKU (product code)"><input className="inp" value={form.sku ?? ''} onChange={(e) => set('sku', e.target.value || null)} placeholder="OG-WILD-01" /></Field>
              <Field label="Reorder level"><input className="inp" type="number" min={0} value={form.reorder_level} onChange={(e) => set('reorder_level', Math.max(0, Number(e.target.value) || 0))} placeholder="5" /></Field>
            </div>
            <Field label="Cost price (₹) — what it costs you, for profit tracking · never shown to customers">
              <input className="inp" type="number" min={0} value={form.cost_price ?? ''} onChange={(e) => set('cost_price', e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))} placeholder="e.g. 600" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="HSN code (GST)"><input className="inp" value={form.hsn ?? ''} onChange={(e) => set('hsn', e.target.value || null)} placeholder="6109" /></Field>
              <Field label="GST rate % (blank = store default)"><input className="inp" type="number" min={0} value={form.gst_rate ?? ''} onChange={(e) => set('gst_rate', e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))} placeholder="5" /></Field>
            </div>
            <Field label="Description"><textarea className="inp resize-none" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="Details & Care (one point per line)">
              <textarea
                className="inp resize-none"
                rows={5}
                value={(form.details_care ?? []).join('\n')}
                onChange={(e) => set('details_care', e.target.value.split('\n'))}
                placeholder={'Premium heavyweight cotton\nRelaxed oversized fit\nMachine wash cold, tumble dry low\nDo not bleach'}
              />
            </Field>
            <Field label="Shipping & Returns">
              <textarea
                className="inp resize-none"
                rows={4}
                value={form.shipping_returns ?? ''}
                onChange={(e) => set('shipping_returns', e.target.value || null)}
                placeholder={'Free standard shipping on orders over ₹2,000. Processed in 1-2 business days.\nReturns accepted within 30 days — unworn, with tags.'}
              />
            </Field>
          </Card>

          {/* Images / variants */}
          <Card title={hasColors ? 'Colours — each with its own photos, price & sizes' : 'Images, price & sizes'}>
            <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
              <input type="checkbox" checked={hasColors} onChange={(e) => toggleHasColors(e.target.checked)} className="h-4 w-4 accent-black" />
              This product has colour options
            </label>

            {hasColors ? (
              <>
                <div className="space-y-4">
                  {form.variants.map((v, idx) => (
                    <VariantEditor
                      key={idx}
                      index={idx}
                      variant={v}
                      active={previewIdx === idx}
                      uploading={uploading}
                      onPreview={() => setPreviewIdx(idx)}
                      onChange={(patch) => updateVariant(idx, patch)}
                      onRemove={() => removeVariant(idx)}
                      uploadFile={uploadFile}
                    />
                  ))}
                </div>
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <span className="block text-xs font-medium text-neutral-600 mb-2">Add a colour</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PALETTE.map((hex) => (
                      <button key={hex} type="button" onClick={() => addVariant(hex)} title={hex}
                        className="h-7 w-7 rounded-full border border-black/10 hover:scale-110 transition-transform" style={{ backgroundColor: hex }} />
                    ))}
                    <span className="inline-flex items-center gap-1.5 ml-1">
                      <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="h-7 w-9 rounded-[5px] border border-neutral-300 cursor-pointer bg-white p-0.5" />
                      <button type="button" onClick={() => addVariant(customColor)} className="rounded-[5px] border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-50">Add colour</button>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <VariantEditor
                index={0}
                variant={form.variants[0] ?? newVariant('')}
                active
                uploading={uploading}
                hideColor
                onPreview={() => {}}
                onChange={(patch) => updateVariant(0, patch)}
                onRemove={() => {}}
                uploadFile={uploadFile}
              />
            )}
          </Card>

          <Card title="Videos (product-level)">
            <Field label="Videos (mp4 / webm · max 50 MB — plays on the product page)">
              <div className="flex flex-wrap items-center gap-3">
                {form.videos.map((url, i) => (
                  <div key={url + i} className="relative">
                    <video src={url} className="h-24 w-32 rounded-[5px] object-cover bg-black border border-neutral-200" muted controls />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, videos: f.videos.filter((_, x) => x !== i) }))} className="absolute -top-2 -right-2 rounded-full bg-red-600 text-white p-0.5"><X size={12} /></button>
                  </div>
                ))}
                <label className="inline-flex flex-col items-center justify-center gap-1 h-24 w-32 rounded-[5px] border border-dashed border-neutral-300 cursor-pointer hover:bg-neutral-50 text-neutral-400 text-xs">
                  <VideoIcon size={20} /> Add video
                  <input type="file" accept="video/*" multiple className="hidden" onChange={pickVideo} disabled={uploading} />
                </label>
              </div>
            </Field>
            {uploading && <p className="text-xs text-neutral-500 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Uploading…</p>}
          </Card>

          <Card title="Tags">
            <Field label="Tags (for search / collections)">
              <div className="flex items-center gap-2 mb-2">
                <input className="inp" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                  placeholder="winter, limited, bestseller — press Enter" />
                <button type="button" onClick={() => addTag(tagInput)} className="rounded-[5px] border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-[5px] bg-neutral-100 px-2 py-1 text-xs">
                    #{t}<button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))} className="text-neutral-400 hover:text-red-600"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </Field>
          </Card>

          <Card title="Visibility & flags">
            <div className="flex flex-wrap gap-5">
              <Check label="Trending" checked={form.trending} onChange={(v) => set('trending', v)} />
              <Check label="New arrival" checked={form.new_arrival} onChange={(v) => set('new_arrival', v)} />
              <Check label="Live on website" checked={form.is_active} onChange={(v) => set('is_active', v)} />
            </div>
            <Field label="Sort order (lower = shown first)">
              <input type="number" className="inp max-w-[160px]" value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
            </Field>
          </Card>
        </div>

        {/* RIGHT: live preview */}
        <div className="lg:sticky lg:top-6">
          <div className="rounded-[5px] border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">Live preview</p>
            <div className="rounded-[5px] overflow-hidden border border-neutral-100">
              <div className="relative aspect-[3/4] bg-neutral-100">
                {pv?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pv.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">No image</div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {form.trending && <span className="text-[10px] font-semibold rounded-[5px] bg-black text-white px-1.5 py-0.5">Trending</span>}
                  {form.new_arrival && <span className="text-[10px] font-semibold rounded-[5px] bg-emerald-500 text-white px-1.5 py-0.5">New</span>}
                </div>
              </div>
              <div className="p-3">
                {form.brand && <p className="text-[10px] uppercase tracking-wide text-neutral-400">{form.brand}</p>}
                <p className="font-semibold text-sm truncate">{form.name || 'Product name'}</p>
                {pv && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold">{formatPrice(pv.price)}</span>
                    {pv.original_price != null && pv.original_price > pv.price && (
                      <>
                        <span className="text-xs text-neutral-400 line-through">{formatPrice(pv.original_price)}</span>
                        <span className="text-[10px] font-semibold text-emerald-600">{pvDiscount}% OFF</span>
                      </>
                    )}
                  </div>
                )}
                {/* colour swatches — click to switch preview */}
                {hasColors && form.variants.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2.5">
                    {form.variants.map((v, i) => (
                      <button key={i} type="button" onClick={() => setPreviewIdx(i)}
                        className={`h-5 w-5 rounded-full border ${previewIdx === i ? 'ring-2 ring-offset-1 ring-black' : 'border-black/10'}`}
                        style={{ backgroundColor: v.color }} title={v.name || v.color} />
                    ))}
                  </div>
                )}
                {pv && pv.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {pv.sizes.map((s) => (
                      <span key={s.size} className={`rounded-[5px] border px-1.5 py-0.5 text-[10px] ${s.stock > 0 ? 'border-neutral-200 text-neutral-600' : 'border-neutral-100 text-neutral-300 line-through'}`}>{s.size}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-3 flex items-center gap-1">
              <CheckIcon size={12} className="text-emerald-500" />
              {hasColors ? ' Click a colour dot to preview that colour.' : ' This is how the product appears to customers.'}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .inp { width: 100%; border-radius: 5px; border: 1px solid #d4d4d4; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; }
        .inp:focus { box-shadow: 0 0 0 2px #000; }
      `}</style>
    </div>
  );
}

function VariantEditor({
  variant, active, uploading, hideColor, onPreview, onChange, onRemove, uploadFile,
}: {
  index: number;
  variant: Variant;
  active: boolean;
  uploading: boolean;
  hideColor?: boolean;
  onPreview: () => void;
  onChange: (patch: Partial<Variant>) => void;
  onRemove: () => void;
  uploadFile: (f: File) => Promise<string | null>;
}) {
  const [sizeInput, setSizeInput] = useState('');

  const pickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); e.target.value = '';
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }
    if (urls.length) onChange({ images: [...variant.images, ...urls] });
  };
  const addSize = (s: string) => {
    const v = s.trim(); if (!v) return;
    if (variant.sizes.some((x) => x.size === v)) return;
    onChange({ sizes: [...variant.sizes, { size: v, stock: 0 }] });
    setSizeInput('');
  };

  return (
    <div className={`rounded-[5px] border p-4 ${active && !hideColor ? 'border-black' : 'border-neutral-200'}`}>
      {!hideColor && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <input type="color" value={variant.color || '#000000'} onChange={(e) => onChange({ color: e.target.value })}
              className="h-8 w-9 rounded-[5px] border border-neutral-300 cursor-pointer bg-white p-0.5" />
            <input className="rounded-[5px] border border-neutral-300 px-2 py-1.5 text-sm w-40" value={variant.name ?? ''}
              onChange={(e) => onChange({ name: e.target.value })} placeholder="Colour name (optional)" />
            <button type="button" onClick={onPreview} className="text-xs text-neutral-500 hover:text-black underline">{active ? 'previewing' : 'preview'}</button>
          </div>
          <button type="button" onClick={onRemove} className="rounded-[5px] p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="block">
          <span className="block text-xs text-neutral-600 mb-1">Price (₹)</span>
          <input type="number" className="w-full rounded-[5px] border border-neutral-300 px-2 py-1.5 text-sm" value={variant.price}
            onChange={(e) => onChange({ price: Number(e.target.value) })} />
        </label>
        <label className="block">
          <span className="block text-xs text-neutral-600 mb-1">MRP / original (₹)</span>
          <input type="number" className="w-full rounded-[5px] border border-neutral-300 px-2 py-1.5 text-sm" value={variant.original_price ?? ''}
            onChange={(e) => onChange({ original_price: e.target.value === '' ? null : Number(e.target.value) })} />
        </label>
      </div>

      {/* images */}
      <span className="block text-xs text-neutral-600 mb-1">{hideColor ? 'Photos' : 'Photos for this colour'}</span>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {variant.images.map((url, i) => (
          <div key={url + i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-16 w-14 rounded-[5px] object-cover bg-neutral-100 border border-neutral-200" />
            <button type="button" onClick={() => onChange({ images: variant.images.filter((_, x) => x !== i) })}
              className="absolute -top-2 -right-2 rounded-full bg-red-600 text-white p-0.5"><X size={12} /></button>
          </div>
        ))}
        <label className="inline-flex items-center justify-center h-16 w-14 rounded-[5px] border border-dashed border-neutral-300 cursor-pointer hover:bg-neutral-50 text-neutral-400">
          <Plus size={18} />
          <input type="file" accept="image/*" multiple className="hidden" onChange={pickImages} disabled={uploading} />
        </label>
      </div>

      {/* sizes + stock */}
      <span className="block text-xs text-neutral-600 mb-1">{hideColor ? 'Sizes & stock' : 'Sizes & stock for this colour'}</span>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {SIZE_PRESETS.map((s) => (
          <button key={s} type="button" onClick={() => addSize(s)} disabled={variant.sizes.some((x) => x.size === s)}
            className="rounded-[5px] border border-neutral-200 px-2 py-0.5 text-xs hover:bg-neutral-50 disabled:opacity-40">{s}</button>
        ))}
        <span className="inline-flex items-center gap-1">
          <input className="rounded-[5px] border border-neutral-300 px-2 py-0.5 text-xs w-24" value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(sizeInput); } }} placeholder="Custom" />
          <button type="button" onClick={() => addSize(sizeInput)} className="rounded-[5px] border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-50">Add</button>
        </span>
      </div>
      {variant.sizes.length > 0 && (
        <div className="space-y-1.5">
          {variant.sizes.map((s, si) => (
            <div key={s.size} className="flex items-center gap-2 text-sm">
              <span className="w-16 font-medium">{s.size}</span>
              <input type="number" value={s.stock}
                onChange={(e) => onChange({ sizes: variant.sizes.map((x, i) => (i === si ? { ...x, stock: Number(e.target.value) } : x)) })}
                className="w-24 rounded-[5px] border border-neutral-300 px-2 py-1 text-sm" placeholder="Stock" />
              <span className="text-xs text-neutral-400">in stock</span>
              <button type="button" onClick={() => onChange({ sizes: variant.sizes.filter((_, i) => i !== si) })}
                className="ml-auto text-neutral-400 hover:text-red-600"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[5px] border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-bold mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-black" />
      {label}
    </label>
  );
}
