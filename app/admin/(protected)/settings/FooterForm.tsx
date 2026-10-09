'use client';

import { useState } from 'react';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FooterConfig, FooterLink } from '@/lib/footer';
import InfoCard from '../../_components/InfoCard';

const inputCls =
  'w-full h-11 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10';

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-600 mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

function StringList({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-600 mb-1">{label}</label>
      <div className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input value={v} onChange={(e) => onChange(items.map((x, idx) => (idx === i ? e.target.value : x)))} className={inputCls} />
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="shrink-0 w-11 h-11 rounded-[5px] border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...items, ''])} className="mt-2 inline-flex items-center gap-1.5 rounded-[5px] border border-dashed border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"><Plus size={14} /> Add line</button>
    </div>
  );
}

function LinkList({ label, items, onChange }: { label: string; items: FooterLink[]; onChange: (v: FooterLink[]) => void }) {
  const set = (i: number, k: keyof FooterLink, val: string) => onChange(items.map((x, idx) => (idx === i ? { ...x, [k]: val } : x)));
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-600 mb-1">{label} (label + link)</label>
      <div className="space-y-2">
        {items.map((l, i) => (
          <div key={i} className="flex gap-2">
            <input value={l.label} onChange={(e) => set(i, 'label', e.target.value)} placeholder="Label" className={inputCls} />
            <input value={l.href} onChange={(e) => set(i, 'href', e.target.value)} placeholder="/link" className={inputCls} />
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="shrink-0 w-11 h-11 rounded-[5px] border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...items, { label: '', href: '' }])} className="mt-2 inline-flex items-center gap-1.5 rounded-[5px] border border-dashed border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"><Plus size={14} /> Add link</button>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

export default function FooterForm({ initial }: { initial: FooterConfig }) {
  const [f, setF] = useState<FooterConfig>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof FooterConfig>(k: K, v: FooterConfig[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ footer: f }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setF(j.footer as FooterConfig);
      toast.success('Footer updated — live now');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mb-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Footer</h1>
          <p className="text-sm text-neutral-500 mt-1">Everything in the site footer — text and links.</p>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
        </button>
      </div>

      <div className="space-y-4">
        <Group title="Round logo badge">
          <Field label="Line 1" value={f.brandLine1} onChange={(v) => set('brandLine1', v)} />
          <Field label="Line 2" value={f.brandLine2} onChange={(v) => set('brandLine2', v)} />
          <Field label="Tagline" value={f.tagline} onChange={(v) => set('tagline', v)} />
        </Group>

        <Group title="Top links">
          <LinkList label="Links" items={f.navLinks} onChange={(v) => set('navLinks', v)} />
        </Group>

        <Group title="Contact column">
          <Field label="Heading" value={f.contactHeading} onChange={(v) => set('contactHeading', v)} />
          <Field label="Phone" value={f.phone} onChange={(v) => set('phone', v)} />
          <Field label="Email" value={f.email} onChange={(v) => set('email', v)} />
          <StringList label="Address lines" items={f.addressLines} onChange={(v) => set('addressLines', v)} />
        </Group>

        <Group title="Hours column">
          <Field label="Heading" value={f.hoursHeading} onChange={(v) => set('hoursHeading', v)} />
          <Field label="Note" value={f.hoursNote} onChange={(v) => set('hoursNote', v)} />
          <StringList label='Hours lines (e.g. "Tues-Fri | 11-5")' items={f.hoursLines} onChange={(v) => set('hoursLines', v)} />
          <Field label="Closed line" value={f.hoursClosed} onChange={(v) => set('hoursClosed', v)} />
        </Group>

        <Group title="Info column">
          <Field label="Heading" value={f.infoHeading} onChange={(v) => set('infoHeading', v)} />
          <LinkList label="Links" items={f.infoLinks} onChange={(v) => set('infoLinks', v)} />
        </Group>

        <Group title="Socials">
          <Field label="Heading" value={f.socialHeading} onChange={(v) => set('socialHeading', v)} />
          <Field label="Facebook URL" value={f.facebook} onChange={(v) => set('facebook', v)} />
          <Field label="Instagram URL" value={f.instagram} onChange={(v) => set('instagram', v)} />
          <Field label="Twitter URL" value={f.twitter} onChange={(v) => set('twitter', v)} />
        </Group>

        <Group title="Newsletter & legal">
          <Field label="Newsletter heading" value={f.newsletterHeading} onChange={(v) => set('newsletterHeading', v)} />
          <LinkList label="Bottom legal links" items={f.legalLinks} onChange={(v) => set('legalLinks', v)} />
          <Field label="Copyright line" value={f.copyright} onChange={(v) => set('copyright', v)} />
        </Group>
      </div>

      <div className="mt-6">
        <InfoCard
          title="How the Footer works"
          intro="This controls every piece of text and link in the footer at the bottom of every page."
          flow={['Edit any field', 'Add/remove links', 'Save', 'Live on every page']}
          steps={[
            { title: 'Links', desc: 'Each link has a label (what people see) and a path (e.g. /about or a full https:// URL).' },
            { title: 'Lists', desc: 'Use “Add line/link” to add rows and the trash icon to remove them.' },
            { title: 'Legal links', desc: 'Terms, Privacy and Cookies show as a small row above the copyright — needed for payment approval.' },
            { title: 'Live', desc: 'Changes appear across the whole site as soon as you Save.' },
          ]}
          note="Page content (About, FAQ, etc.) is edited under Settings → Pages."
        />
      </div>
    </div>
  );
}
