'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileDown, Loader2 } from 'lucide-react';
import { exportCSV, exportExcel, exportPDF, type Row } from '@/lib/export';

/**
 * A small "Export ▾" dropdown. Give it the column headers and the rows to export;
 * it offers Excel, PDF and CSV. `getData` lets callers compute rows lazily on click.
 */
export default function ExportMenu({
  filename,
  title,
  headers,
  rows,
  getData,
  label = 'Export',
  disabled,
}: {
  filename: string;
  title: string;
  headers?: string[];
  rows?: Row[];
  getData?: () => { headers: string[]; rows: Row[] };
  label?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const resolve = () => (getData ? getData() : { headers: headers ?? [], rows: rows ?? [] });

  const run = async (kind: 'excel' | 'pdf' | 'csv') => {
    setOpen(false);
    setBusy(true);
    try {
      const { headers: h, rows: r } = resolve();
      if (kind === 'csv') exportCSV(filename, h, r);
      else if (kind === 'excel') await exportExcel(filename, title.slice(0, 28), h, r);
      else await exportPDF(filename, title, h, r);
    } catch {
      /* swallow — a failed export shouldn't crash the page */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled || busy}
        className="inline-flex items-center gap-1.5 rounded-[5px] border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} {label}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-[5px] border border-neutral-200 bg-white shadow-lg py-1">
          <button onClick={() => run('excel')} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
            <FileSpreadsheet size={15} className="text-emerald-600" /> Excel (.xlsx)
          </button>
          <button onClick={() => run('pdf')} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
            <FileText size={15} className="text-red-500" /> PDF
          </button>
          <button onClick={() => run('csv')} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
            <FileDown size={15} className="text-blue-500" /> CSV
          </button>
        </div>
      )}
    </div>
  );
}
