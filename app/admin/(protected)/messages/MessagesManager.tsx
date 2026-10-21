'use client';

import { useMemo, useState, useTransition } from 'react';
import { Trash2, MessageSquare, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { deleteMessage } from './actions';
import InfoCard from '../../_components/InfoCard';

export interface MsgRow {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export default function MessagesManager({ initialRows }: { initialRows: MsgRow[] }) {
  const [rows, setRows] = useState<MsgRow[]>(initialRows);
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      r.email.toLowerCase().includes(t) || r.name.toLowerCase().includes(t) || r.message.toLowerCase().includes(t)
    );
  }, [rows, q]);

  const remove = (r: MsgRow) => {
    setBusyId(r.id);
    startTransition(async () => {
      const res = await deleteMessage(r.id);
      setBusyId(null);
      if (res.ok) { setRows((p) => p.filter((x) => x.id !== r.id)); toast.success('Deleted'); }
      else toast.error(res.error);
    });
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Messages sent from the Contact Us page. <span className="font-medium text-neutral-700">{rows.length}</span> total.
          </p>
        </div>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name, email or message…"
        className="w-full sm:w-80 h-10 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10 mb-5"
      />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500 flex flex-col items-center gap-2 mb-6">
          <MessageSquare size={22} className="text-neutral-300" />
          {rows.length === 0 ? 'No messages yet.' : 'No matches.'}
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{r.name || 'Anonymous'}</p>
                  <a href={`mailto:${r.email}`} className="text-xs text-neutral-500 inline-flex items-center gap-1 hover:text-neutral-800">
                    <Mail size={12} /> {r.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-neutral-400 whitespace-nowrap">{new Date(r.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <button
                    onClick={() => remove(r)}
                    disabled={busyId === r.id}
                    className="w-8 h-8 rounded-[5px] border border-red-200 text-red-500 inline-flex items-center justify-center hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-neutral-700 mt-3 whitespace-pre-line leading-relaxed">{r.message}</p>
            </div>
          ))}
        </div>
      )}

      <InfoCard
        title="How Messages work"
        intro="Every message a visitor sends from the Contact Us page lands here."
        flow={['Visitor fills the form', 'Clicks Send', 'Saved here', 'Reply by email']}
        steps={[
          { title: 'Reply', desc: 'Click the email address to reply directly from your mail app.' },
          { title: 'Delete', desc: 'Remove handled messages with the trash icon.' },
          { title: 'No login needed', desc: 'Anyone on the site can send a message.' },
        ]}
      />
    </div>
  );
}
