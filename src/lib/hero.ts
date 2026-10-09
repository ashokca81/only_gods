// Shared Hero config — safe to import from both client and server (no server-only deps).

export type MediaType = 'video' | 'image';

export interface HeroConfig {
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  desktopType: MediaType;
  desktopUrl: string;
  desktopPoster: string;
  mobileType: MediaType;
  mobileUrl: string;
  mobilePoster: string;
}

/** Current live look — used as fallback so the site never breaks when nothing is saved. */
export const DEFAULT_HERO: HeroConfig = {
  title: 'Only Gods',
  subtitle: '',
  cta: 'Shop Now',
  ctaLink: '/shop',
  desktopType: 'video',
  desktopUrl: 'https://videos.pexels.com/video-files/10330518/10330518-uhd_2560_1440_25fps.mp4',
  desktopPoster: 'https://images.unsplash.com/photo-1523396896303-1e8ee5006752?q=80&w=2940&auto=format&fit=crop',
  mobileType: 'video',
  mobileUrl: 'https://videos.pexels.com/video-files/6615627/6615627-uhd_1440_2732_25fps.mp4',
  mobilePoster: 'https://images.pexels.com/videos/7710243/free-video-7710243.jpg?auto=compress&cs=tinysrgb&fit=crop&h=1920&w=1080',
};

/** Merge a stored settings value (partial / unknown shape) onto the defaults. */
export function mergeHero(value: unknown): HeroConfig {
  const v = (value ?? {}) as Partial<HeroConfig>;
  const pick = (s: unknown, fallback: string) =>
    typeof s === 'string' && s.trim() !== '' ? s : fallback;
  const pickType = (t: unknown, fallback: MediaType): MediaType =>
    t === 'video' || t === 'image' ? t : fallback;
  return {
    title: pick(v.title, DEFAULT_HERO.title),
    // subtitle may be intentionally empty, so allow empty string through.
    subtitle: typeof v.subtitle === 'string' ? v.subtitle : DEFAULT_HERO.subtitle,
    cta: pick(v.cta, DEFAULT_HERO.cta),
    ctaLink: pick(v.ctaLink, DEFAULT_HERO.ctaLink),
    desktopType: pickType(v.desktopType, DEFAULT_HERO.desktopType),
    desktopUrl: pick(v.desktopUrl, DEFAULT_HERO.desktopUrl),
    desktopPoster: pick(v.desktopPoster, DEFAULT_HERO.desktopPoster),
    mobileType: pickType(v.mobileType, DEFAULT_HERO.mobileType),
    mobileUrl: pick(v.mobileUrl, DEFAULT_HERO.mobileUrl),
    mobilePoster: pick(v.mobilePoster, DEFAULT_HERO.mobilePoster),
  };
}
