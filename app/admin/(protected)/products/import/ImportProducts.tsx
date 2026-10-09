'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { exportExcel, parseSpreadsheet } from '@/lib/export';
import { EMPTY_PRODUCT } from '../product-defaults';
import { bulkCreateProducts } from '../actions';
import type { ProductInput } from '../actions';
import InfoCard from '../../../_components/InfoCard';

const COLUMNS = ['Name', 'Category', 'Collections', 'Price', 'MRP', 'Cost', 'Stock', 'SKU', 'Brand', 'HSN', 'GST', 'Description', 'Image', 'Tags', 'Status'];
const EXAMPLE = ['Black Hoodie', 'Hoodies', 'Winter Season; New Models 2026', '1299', '1999', '600', '25', 'HD-001', 'Only Gods', '6109', '5', 'Premium cotton hoodie', 'https://example.com/hoodie.jpg', 'bestseller; cotton', 'Live'];

const splitList = (s: string) => (s || '').split(/[;,]/).map((x) => x.trim()).filter(Boolean);
const num = (s: string) => { const n = Number(String(s).replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : NaN; };

interface ParsedRow {
  raw: Record<string, string>;
  input: ProductInput | null;
  errors: string[];
}

function rowToInput(r: Record<string, string>): { input: ProductInput | null; errors: string[] } {
  const get = (k: string) => (r[k] ?? r[k.toLowerCase()] ?? '').toString().trim();
  const errors: string[] = [];
  const name = get('Name');
  if (!name) errors.push('Name is required');
  const price = num(get('Price'));
  if (get('Price') && Number.isNaN(price)) errors.push('Price must be a number');
  const mrpStr = get('MRP');
  const mrp = mrpStr ? num(mrpStr) : null;
  const costStr = get('Cost');
  const cost = costStr ? num(costStr) : null;
  const stock = get('Stock') ? num(get('Stock')) : 0;
  const image = get('Image');

  if (errors.length) return { input: null, errors };

  const input: ProductInput = {
    ...EMPTY_PRODUCT,
    name,
    category: get('Category'),
    collections: splitList(get('Collections')),
    price: Number.isNaN(price) ? 0 : price,
    original_price: mrp != null && !Number.isNaN(mrp) ? mrp : null,
    cost_price: cost != null && !Number.isNaN(cost) ? cost : null,
    hsn: get('HSN') || null,
    gst_rate: get('GST') ? num(get('GST')) : null,
    stock: Number.isNaN(stock) ? 0 : stock,
    sku: get('SKU') || null,
    brand: get('Brand') || null,
    description: get('Description'),
    image,
    images: image ? [image] : [],
    tags: splitList(get('Tags')),
    is_active: get('Status').toLowerCase() !== 'hidden',
  };
  return { input, errors: [] };
}

export default function ImportProducts() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [saving, startSave] = useTransition();

  const valid = rows.filter((r) => r.input && r.errors.length === 0);
  const invalid = rows.filter((r) => r.errors.length > 0);

  const downloadTemplate = () => exportExcel('product-import-template', 'Products', COLUMNS, [EXAMPLE]);

  const onFile = async (file: File) => {
    setParsing(true);
    setFileName(file.name);
    try {
      const raw = await parseSpreadsheet(file);
      const parsed: ParsedRow[] = raw.map((r) => {
        const { input, errors } = rowToInput(r);
        return { raw: r, input, errors };
      });
      setRows(parsed);
      if (parsed.length === 0) toast.error('No rows found in the file');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not read the file');
    } finally {
      setParsing(false);
    }
  };

  const doImport = () => {
    const inputs = valid.map((r) => r.input!) as ProductInput[];
    if (!inputs.length) { toast.error('Nothing valid to import'); return; }
    startSave(async () => {
      const res = await bulkCreateProducts(inputs);
      if (res.ok) {
        toast.success(`Imported ${res.count} product${res.count === 1 ? '' : 's'}`);
        router.push('/admin/products');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="max-w-4xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black mb-4">
        <ArrowLeft size={15} /> Back to Products
      </Link>
      <h1 className="text-2xl font-bold mb-1">Import products</h1>
      <p className="text-sm text-neutral-500 mb-5">Add many products at once from an Excel or CSV file.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-[5px] border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-50">
          <Download size={16} /> Download template
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={parsing} className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60">
          {parsing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload file
        </button>
        {fileName && <span className="self-center text-sm text-neutral-500">{fileName}</span>}
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex items-center gap-4 mb-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={16} /> {valid.length} ready</span>
            {invalid.length > 0 && <span className="inline-flex items-center gap-1.5 text-red-500"><AlertTriangle size={16} /> {invalid.length} with errors (skipped)</span>}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden mb-5">
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-neutral-50">
                  <tr className="text-left text-neutral-500 border-b border-neutral-200">
                    <th className="py-2 px-3 font-medium">#</th>
                    <th className="py-2 px-3 font-medium">Name</th>
                    <th className="py-2 px-3 font-medium">Category</th>
                    <th className="py-2 px-3 font-medium text-right">Price</th>
                    <th className="py-2 px-3 font-medium text-right">Stock</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={`border-b border-neutral-100 last:border-0 ${r.errors.length ? 'bg-red-50' : ''}`}>
                      <td className="py-2 px-3 text-neutral-400">{i + 1}</td>
                      <td className="py-2 px-3 font-medium">
                        {r.input?.name || r.raw.Name || '—'}
                        {r.errors.length > 0 && <span className="block text-[11px] text-red-500">{r.errors.join(', ')}</span>}
                      </td>
                      <td className="py-2 px-3 text-neutral-600">{r.input?.category || '—'}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{r.input ? r.input.price : '—'}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{r.input ? r.input.stock : '—'}</td>
                      <td className="py-2 px-3">{r.input ? (r.input.is_active ? 'Live' : 'Hidden') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button onClick={doImport} disabled={saving || valid.length === 0} className="inline-flex items-center gap-2 rounded-[5px] bg-emerald-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import {valid.length} product{valid.length === 1 ? '' : 's'}
          </button>
        </>
      )}

      <div className="mt-8">
        <InfoCard
          title="How product import works"
          intro="Bring in a whole catalog at once instead of adding products one by one."
          flow={['Download template', 'Fill your products', 'Upload the file', 'Review & import']}
          steps={[
            { title: 'Template', desc: 'Download the Excel template — it has the exact columns. Keep the header row.' },
            { title: 'Columns', desc: 'Name is required. Collections & Tags can hold many values separated by ; (semicolon). Status = Live or Hidden.' },
            { title: 'Review', desc: 'After upload you see a preview. Rows with errors turn red and are skipped — only valid rows import.' },
            { title: 'Images & variants', desc: 'Give one Image URL per product. For multiple colours/sizes, edit the product after importing.' },
          ]}
          note="Importing adds new products. To update existing ones, edit them individually."
        />
      </div>
    </div>
  );
}
