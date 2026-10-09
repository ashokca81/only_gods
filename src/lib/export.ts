'use client';

// Lightweight client-side export helpers (CSV / Excel / PDF).
// Heavy libs (xlsx, jspdf) are dynamically imported so they only load on use.

export type Cell = string | number;
export type Row = Cell[];

const STORE_NAME = 'ONLY GODS';
const STORE_ADDR = 'D.No 12-3-45, Governorpet, Vijayawada, Andhra Pradesh - 520002';

function stamp() {
  return new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CSV — no external lib. */
export function exportCSV(filename: string, headers: string[], rows: Row[]) {
  const esc = (v: Cell) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  triggerDownload(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

/** Excel (.xlsx) via SheetJS. */
export async function exportExcel(filename: string, sheetName: string, headers: string[], rows: Row[]) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Auto width from the longest cell per column.
  ws['!cols'] = headers.map((h, i) => {
    const max = Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length));
    return { wch: Math.min(Math.max(max + 2, 8), 50) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** Read the first sheet of an .xlsx / .csv file into row objects keyed by header. */
export async function parseSpreadsheet(file: File): Promise<Record<string, string>[]> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '', raw: false });
}

const LOGO_URL = '/dark_logo.png';

/** Load an image (same-origin) into a PNG data URL + natural size for jsPDF. */
function loadImage(url: string): Promise<{ dataUrl: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas context'));
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('logo load failed'));
    img.src = url;
  });
}

/** Professional, branded PDF via jsPDF + autotable (real logo header + footer). */
export async function exportPDF(filename: string, title: string, headers: string[], rows: Row[]) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ orientation: headers.length > 6 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14;
  const generatedAt = stamp();

  let logo: { dataUrl: string; w: number; h: number } | null = null;
  try { logo = await loadImage(LOGO_URL); } catch { /* fall back to text wordmark */ }

  const drawHeader = () => {
    const topY = 11;
    if (logo) {
      const logoH = 11;
      const logoW = logoH * (logo.w / logo.h);
      doc.addImage(logo.dataUrl, 'PNG', M, topY, logoW, logoH);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.setTextColor(15, 23, 42);
      doc.text(STORE_NAME, M, topY + 8);
    }
    // Store address (right aligned, muted)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text(STORE_ADDR, pageW - M, topY + 3, { align: 'right' });

    // Accent divider
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(M, 26, pageW - M, 26);

    // Report title + timestamp
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text(title, M, 34);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Generated ${generatedAt}`, pageW - M, 34, { align: 'right' });
  };

  const drawFooter = (pageNumber: number) => {
    doc.setDrawColor(228);
    doc.setLineWidth(0.3);
    doc.line(M, pageH - 12, pageW - M, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`${STORE_NAME} · Vijayawada`, M, pageH - 8);
    doc.text(`Page ${pageNumber}`, pageW - M, pageH - 8, { align: 'right' });
  };

  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((c) => String(c ?? ''))),
    startY: 40,
    margin: { top: 40, left: M, right: M, bottom: 16 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: [232, 232, 232], lineWidth: 0.1, textColor: [40, 40, 40] },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'left' },
    alternateRowStyles: { fillColor: [247, 248, 250] },
    didDrawPage: (data) => {
      drawHeader();
      drawFooter(data.pageNumber);
    },
  });

  doc.save(`${filename}.pdf`);
}
