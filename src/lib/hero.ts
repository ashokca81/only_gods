// Shared Hero config — safe to import from both client and server (no server-only deps).

export type MediaType = 'video' | 'image';
export type TitleStyle = 'overlay' | 'solid' | 'outline';
export type TitlePosition = 'top' | 'center' | 'bottom';

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
  // Title — advanced
  titleDesktopShow: boolean;
  titleMobileShow: boolean;
  titleMobile: string;      // '' = same as title
  titleSize: number;        // % of the default size (40–160)
  titleColor: string;
  titleStyle: TitleStyle;   // overlay = blended into the image (original look)
  titlePosition: TitlePosition;
}

/** Current live look — used as fallback so the site never breaks when nothing is saved. */
export const DEFAULT_HERO: HeroConfig = {
  title: 'Only Gods',
  subtitle: '',
  cta: 'Shop Now',
  ctaLink: '/shop',
  // Default is a static image (never an autoplay video) so nothing plays
  // before the admin's hero setting loads.
  desktopType: 'image',
  desktopUrl: 'https://images.unsplash.com/photo-1523396896303-1e8ee5006752?q=80&w=2940&auto=format&fit=crop',
  desktopPoster: 'https://images.unsplash.com/photo-1523396896303-1e8ee5006752?q=80&w=2940&auto=format&fit=crop',
  mobileType: 'image',
  mobileUrl: 'https://images.pexels.com/videos/7710243/free-video-7710243.jpg?auto=compress&cs=tinysrgb&fit=crop&h=1920&w=1080',
  mobilePoster: 'https://images.pexels.com/videos/7710243/free-video-7710243.jpg?auto=compress&cs=tinysrgb&fit=crop&h=1920&w=1080',
  titleDesktopShow: true,
  titleMobileShow: true,
  titleMobile: '',
  titleSize: 100,
  titleColor: '#ffffff',
  titleStyle: 'overlay',
  titlePosition: 'center',
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
    titleDesktopShow: typeof v.titleDesktopShow === 'boolean' ? v.titleDesktopShow : DEFAULT_HERO.titleDesktopShow,
    titleMobileShow: typeof v.titleMobileShow === 'boolean' ? v.titleMobileShow : DEFAULT_HERO.titleMobileShow,
    titleMobile: typeof v.titleMobile === 'string' ? v.titleMobile : DEFAULT_HERO.titleMobile,
    titleSize: typeof v.titleSize === 'number' && v.titleSize >= 40 && v.titleSize <= 160 ? v.titleSize : DEFAULT_HERO.titleSize,
    titleColor: typeof v.titleColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.titleColor) ? v.titleColor : DEFAULT_HERO.titleColor,
    titleStyle: v.titleStyle === 'solid' || v.titleStyle === 'outline' || v.titleStyle === 'overlay' ? v.titleStyle : DEFAULT_HERO.titleStyle,
    titlePosition: v.titlePosition === 'top' || v.titlePosition === 'bottom' || v.titlePosition === 'center' ? v.titlePosition : DEFAULT_HERO.titlePosition,
  };
}
