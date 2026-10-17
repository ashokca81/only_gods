'use client';

import { useState } from 'react';
import { Loader2, Save, MoonStar } from 'lucide-react';
import { toast } from 'sonner';
import { scheduledTheme, type ThemeScheduleConfig } from '@/lib/themeSchedule';

const inputCls = 'h-11 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10';

export default function ThemeScheduleForm({ initial }: { initial: ThemeScheduleConfig }) {
  const [c, setC] = useState<ThemeScheduleConfig>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ThemeScheduleConfig>(k: K, v: ThemeScheduleConfig[K]) => setC((p) => ({ ...p, [k]: v }));

  const nowTheme = scheduledTheme(c);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/theme-schedule', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeSchedule: c }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setC(j.themeSchedule as ThemeScheduleConfig);
      toast.success('Theme schedule updated — live now');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2"><MoonStar size={16} /> Auto Dark / Light (IST)</h2>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={c.enabled} onChange={(e) => set('enabled', e.target.checked)} className="w-4 h-4" />
          <span className="text-sm font-medium">Automatically switch theme by time of day</span>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-neutral-600">Light mode starts (IST)</span>
            <input type="time" value={c.lightStart} onChange={(e) => set('lightStart', e.target.value)} className={`${inputCls} mt-1 w-full`} />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Dark mode starts (IST)</span>
            <input type="time" value={c.darkStart} onChange={(e) => set('darkStart', e.target.value)} className={`${inputCls} mt-1 w-full`} />
          </label>
        </div>

        <p className="text-sm text-neutral-500">
          Right now (IST) the site would be <strong className="uppercase">{nowTheme}</strong> mode.
          Example: Light 06:00 → Dark 18:00 means light all day, dark at night.
        </p>
        <p className="text-[11px] text-neutral-400">
          If a visitor manually flips the theme, their choice sticks for ~1 hour (even on refresh), then the schedule resumes.
          All times are India time and apply to every visitor.
        </p>
      </div>
    </div>
  );
}
