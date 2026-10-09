'use client';

import { Printer } from 'lucide-react';

export default function PrintButton({ label = 'Download Invoice (PDF)' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print"
      style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 5, background: '#0f172a', color: '#fff', padding: '10px 16px', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,.2)', border: 'none', cursor: 'pointer' }}
    >
      <Printer size={16} /> {label}
    </button>
  );
}
