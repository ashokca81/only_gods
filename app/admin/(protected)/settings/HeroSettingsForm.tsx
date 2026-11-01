'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, Save, Video, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { HeroConfig, MediaType, TitleStyle, TitlePosition } from '@/lib/hero';
import InfoCard from '../../_components/InfoCard';

const inputCls =
  'w-full h-11 px-3 rounded-[5px] border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/10';

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || 'Upload failed');
  return j.url as string;
}

function MediaBlock({
  label,
  type,
  url,
  poster,
  onType,
  onUrl,
  onPoster,
}: {
  label: string;
  type: MediaType;
  url: string;
  poster: string;
  onType: (t: MediaType) => void;
  onUrl: (u: string) => void;
  onPoster: (u: string) => void;
}) {
  const [busy, setBusy] = useState<'media' | 'poster' | null>(null);
  const mediaRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);

  const doUpload = async (file: File, which: 'media' | 'poster') => {
    setBusy(which);
    try {
      const u = await uploadFile(file);
      if (which === 'media') onUrl(u);
      else onPoster(u);
      toast.success('Uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <div className="flex rounded-[5px] border border-neutral-200 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => onType('video')}
            className={`flex items-center gap-1 px-3 py-1.5 ${type === 'video' ? 'bg-black text-white' : 'bg-white text-neutral-600'}`}
          >
            <Video size={13} /> Video
          </button>
          <button
            type="button"
            onClick={() => onType('image')}
            className={`flex items-center gap-1 px-3 py-1.5 ${type === 'image' ? 'bg-black text-white' : 'bg-white text-neutral-600'}`}
          >
            <ImageIcon size={13} /> Image
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="aspect-video w-full rounded-[5px] overflow-hidden bg-neutral-100 border border-neutral-200">
        {url ? (
          type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="w-full h-full object-cover" />
          ) : (
            <video src={url} poster={poster} muted loop autoPlay playsInline className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No media</div>
        )}
      </div>

      <div className="flex gap-2">
        <input value={url} onChange={(e) => onUrl(e.target.value)} placeholder={`${type} URL`} className={inputCls} />
        <input
          ref={mediaRef}
          type="file"
          accept={type === 'image' ? 'image/*' : 'video/*'}
          hidden
          onChange={(e) => e.target.files?.[0] && doUpload(e.target.files[0], 'media')}
        />
        <button
          type="button"
          onClick={() => mediaRef.current?.click()}
          disabled={busy === 'media'}
          className="shrink-0 h-11 px-3 rounded-[5px] bg-neutral-900 text-white text-sm flex items-center gap-1.5 disabled:opacity-60"
        >
          {busy === 'media' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload
        </button>
      </div>

      {type === 'video' && (
        <div className="flex gap-2">
          <input value={poster} onChange={(e) => onPoster(e.target.value)} placeholder="Poster image URL (shown while video loads)" className={inputCls} />
          <input
            ref={posterRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && doUpload(e.target.files[0], 'poster')}
          />
          <button
            type="button"
            onClick={() => posterRef.current?.click()}
            disabled={busy === 'poster'}
            className="shrink-0 h-11 px-3 rounded-[5px] border border-neutral-300 text-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            {busy === 'poster' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Poster
          </button>
        </div>
      )}
      <p className="text-[11px] text-neutral-400">Video max 50 MB. Image max 8 MB.</p>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[5px] border border-neutral-200 px-3 h-11 cursor-pointer">
      <span className="text-sm">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-black' : 'bg-neutral-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

function Segments<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-[5px] border border-neutral-200 overflow-hidden text-xs mt-1">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`flex-1 px-3 py-2 ${value === o.v ? 'bg-black text-white' : 'bg-white text-neutral-600'}`}>{o.label}</button>
      ))}
    </div>
  );
}

function TitleAdvanced({ hero, set }: { hero: HeroConfig; set: <K extends keyof HeroConfig>(k: K, v: HeroConfig[K]) => void }) {
  const previewStyle: React.CSSProperties = {
    color: hero.titleStyle === 'outline' ? 'transparent' : hero.titleColor,
    WebkitTextStroke: hero.titleStyle === 'outline' ? `1px ${hero.titleColor}` : undefined,
    mixBlendMode: hero.titleStyle === 'overlay' ? 'overlay' : undefined,
    fontSize: `${(hero.titleSize / 100) * 2.2}rem`,
  };
  const pos = hero.titlePosition === 'top' ? 'items-start pt-3' : hero.titlePosition === 'bottom' ? 'items-end pb-3' : 'items-center';
  return (
    <div className="rounded-xl border border-neutral-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold">Title — show / hide &amp; style</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Toggle label="Show title on Desktop" checked={hero.titleDesktopShow} onChange={(v) => set('titleDesktopShow', v)} />
        <Toggle label="Show title on Mobile" checked={hero.titleMobileShow} onChange={(v) => set('titleMobileShow', v)} />
      </div>
      <label className="block">
        <span className="text-sm text-neutral-600">Mobile title (optional — leave empty to use the same title)</span>
        <input value={hero.titleMobile} onChange={(e) => set('titleMobile', e.target.value)} placeholder={hero.title} className={`${inputCls} mt-1`} />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-neutral-600">Size — {hero.titleSize}%</span>
          <input type="range" min={40} max={160} step={5} value={hero.titleSize} onChange={(e) => set('titleSize', Number(e.target.value))} className="w-full mt-3 accent-black" />
        </label>
        <label className="block">
          <span className="text-sm text-neutral-600">Colour</span>
          <div className="flex gap-2 mt-1">
            <input type="color" value={hero.titleColor} onChange={(e) => set('titleColor', e.target.value)} className="h-11 w-14 rounded-[5px] border border-neutral-200 bg-white p-1 cursor-pointer" />
            <input value={hero.titleColor} onChange={(e) => set('titleColor', e.target.value)} className={inputCls} />
          </div>
        </label>
        <div>
          <span className="text-sm text-neutral-600">Style</span>
          <Segments<TitleStyle> value={hero.titleStyle} onChange={(v) => set('titleStyle', v)}
            options={[{ v: 'overlay', label: 'Blended' }, { v: 'solid', label: 'Solid' }, { v: 'outline', label: 'Outline' }]} />
        </div>
        <div>
          <span className="text-sm text-neutral-600">Position</span>
          <Segments<TitlePosition> value={hero.titlePosition} onChange={(v) => set('titlePosition', v)}
            options={[{ v: 'top', label: 'Top' }, { v: 'center', label: 'Center' }, { v: 'bottom', label: 'Bottom' }]} />
        </div>
      </div>
      {/* Mini preview */}
      <div className="relative h-36 rounded-[5px] overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {hero.desktopType === 'image' && hero.desktopUrl && <img src={hero.desktopUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
        <div className={`absolute inset-0 flex justify-center ${pos}`}>
          {hero.titleDesktopShow
            ? <span style={previewStyle} className="font-black uppercase tracking-[0.15em] whitespace-nowrap font-display">{hero.title}</span>
            : <span className="text-xs text-white/60 self-center">Title hidden on desktop</span>}
        </div>
      </div>
    </div>
  );
}

export default function HeroSettingsForm({ initialHero }: { initialHero: HeroConfig }) {
  const [hero, setHero] = useState<HeroConfig>(initialHero);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof HeroConfig>(k: K, v: HeroConfig[K]) => setHero((h) => ({ ...h, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Save failed');
      setHero(j.hero as HeroConfig);
      toast.success('Hero section updated — live on your site now');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-neutral-500 mt-1">Control the home page hero — media and text.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-[5px] bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-5">
        <h2 className="font-semibold">Hero text</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-neutral-600">Title</span>
            <input value={hero.title} onChange={(e) => set('title', e.target.value)} className={`${inputCls} mt-1`} />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Subtitle (optional)</span>
            <input value={hero.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="Leave empty to hide" className={`${inputCls} mt-1`} />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Button text</span>
            <input value={hero.cta} onChange={(e) => set('cta', e.target.value)} className={`${inputCls} mt-1`} />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-600">Button link</span>
            <input value={hero.ctaLink} onChange={(e) => set('ctaLink', e.target.value)} placeholder="/shop" className={`${inputCls} mt-1`} />
          </label>
        </div>

        <TitleAdvanced hero={hero} set={set} />

        <h2 className="font-semibold pt-2">Hero background</h2>
        <MediaBlock
          label="Desktop (16:9)"
          type={hero.desktopType}
          url={hero.desktopUrl}
          poster={hero.desktopPoster}
          onType={(t) => set('desktopType', t)}
          onUrl={(u) => set('desktopUrl', u)}
          onPoster={(u) => set('desktopPoster', u)}
        />
        <MediaBlock
          label="Mobile (9:16)"
          type={hero.mobileType}
          url={hero.mobileUrl}
          poster={hero.mobilePoster}
          onType={(t) => set('mobileType', t)}
          onUrl={(u) => set('mobileUrl', u)}
          onPoster={(u) => set('mobilePoster', u)}
        />
      </div>

      <div className="mt-6">
        <InfoCard
          title="How the Hero settings work"
          intro="The hero is the big banner at the top of your home page. Change its background and text here."
          flow={['Pick Video or Image', 'Upload or paste URL', 'Edit the text', 'Save → live instantly']}
          steps={[
            { title: 'Desktop & Mobile', desc: 'Set them separately — a tall 9:16 for phones, a wide 16:9 for computers.' },
            { title: 'Video or Image', desc: 'Toggle per device. For video, also add a poster image shown while it loads.' },
            { title: 'Text', desc: 'Change the title, an optional subtitle, the button label and where the button links.' },
            { title: 'Title show / hide', desc: 'Turn the big title on or off separately for Desktop and Mobile, give Mobile its own text, and change size, colour, style and position.' },
            { title: 'Safe', desc: 'If you clear a field it falls back to the default — the site never shows a blank hero.' },
          ]}
          note="Changes go live the moment you press Save — just refresh the home page."
        />
      </div>
    </div>
  );
}
