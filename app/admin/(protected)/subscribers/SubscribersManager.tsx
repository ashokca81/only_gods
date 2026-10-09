'use client';

import { useMemo, useState, useTransition } from 'react';
import { Trash2, Copy, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { deleteSubscriber } from './actions';
import InfoCard from '../../_components/InfoCard';
import ExportMenu from '../../_components/ExportMenu';
import type { Row } from '@/lib/export';

export interface SubRow {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

/** Make a raw source value human-readable (e.g. "section:/shop" → "Home section · /shop"). */
function prettySource(s: string): string {
  if (!s) return '—';
  if (s === 'footer') return 'Footer';
  if (s.startsWith('section:')) return `Page section · ${s.slice('section:'.length)}`;
  return s;
}

export default function SubscribersManager({ initialRows }: { initialRows: SubRow[] }) {
  const [rows, setRows] = useState<SubRow[]>(initialRows);
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => r.email.toLowerCase().includes(t) || r.source.toLowerCase().includes(t));
  }, [rows, q]);

  const remove = (r: SubRow) => {
    setBusyId(r.id);
    startTransition(async () => {
      const res = await deleteSubscriber(r.id);
      setBusyId(null);
      if (res.ok) { setRows((p) => p.filter((x) => x.id !== r.id)); toast.success('Removed'); }
      else toast.error(res.error);
    });
  };

  const copyAll = async () => {
    const list = filtered.map((r) => r.email).join(', ');
    if (!list) return;
    try { await navigator.clipboard.writeText(list); toast.success(`${filtered.length} emails copied`); }
    catch { toast.error('Copy failed'); }
  };

  const exportData = () => {
    const headers = ['Email', 'Source', 'Subscribed'];
    const data: Row[] = filtered.map((r) => [
      r.email, prettySource(r.source), new Date(r.created_at).toLocaleString('en-IN'),
    ]);
    return { headers, rows: data };
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Emails captured from the newsletter section and the footer. <span className="font-medium text-neutral-700">{rows.length}</span> total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyAll}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-[5px] border border-neutral-200 px-3 h-10 text-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            <Copy size={14} /> Copy emails
          </button>
          <ExportMenu filename="subscribers" title="Newsletter subscribers" getData={exportData} disabled={filtered.length === 0} />
        </div>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search email or source…"
        className="w-full sm:w-80 h-10 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10 mb-5"
      />

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden mb-6">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500 flex flex-col items-center gap-2">
            <Mail size={22} className="text-neutral-300" />
            {rows.length === 0 ? 'No subscribers yet.' : 'No matches.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-200">
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Source</th>
                  <th className="py-3 px-4 font-medium">Subscribed</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-3 px-4 font-medium">{r.email}</td>
                    <td className="py-3 px-4 text-neutral-600">{prettySource(r.source)}</td>
                    <td className="py-3 px-4 text-neutral-500">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => remove(r)}
                        disabled={busyId === r.id}
                        className="w-8 h-8 rounded-[5px] border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InfoCard
        title="How Subscribers work"
        intro="Every email entered on the site (the big “Join the Club of Gods” section or the footer box) is saved here."
        flow={['Visitor enters email', 'Clicks Subscribe', 'Saved here', 'Export for a campaign']}
        steps={[
          { title: 'Where from', desc: 'The “Source” column shows where they signed up — the footer, or a page section with its page path.' },
          { title: 'No duplicates', desc: 'The same email is stored only once, even if entered again.' },
          { title: 'Copy / Export', desc: 'Use “Copy emails” for a quick paste, or Export for an Excel/PDF/CSV file.' },
          { title: 'Privacy', desc: 'These are marketing opt-ins — only email them about ONLY GODS drops and offers.' },
        ]}
        note="Subscribing needs no login — anyone on the site can join."
      />
    </div>
  );
}
