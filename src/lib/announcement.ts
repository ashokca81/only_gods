// Dashboard-managed top announcement bar. Safe to import from client and server.

export interface AnnouncementConfig {
  enabled: boolean;
  text: string;
  link: string;   // optional; whole bar becomes a link when set
  bg: string;     // background colour (hex)
  fg: string;     // text colour (hex)
}

export const DEFAULT_ANNOUNCEMENT: AnnouncementConfig = {
  enabled: false,
  text: 'Free shipping on orders above ₹2000 🚚',
  link: '',
  bg: '#0f172a',
  fg: '#ffffff',
};

export function mergeAnnouncement(value: unknown): AnnouncementConfig {
  const v = (value ?? {}) as Partial<AnnouncementConfig>;
  const pick = (s: unknown, fb: string) => (typeof s === 'string' && s.trim() !== '' ? s : fb);
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : DEFAULT_ANNOUNCEMENT.enabled,
    text: typeof v.text === 'string' ? v.text : DEFAULT_ANNOUNCEMENT.text,
    link: typeof v.link === 'string' ? v.link : DEFAULT_ANNOUNCEMENT.link,
    bg: pick(v.bg, DEFAULT_ANNOUNCEMENT.bg),
    fg: pick(v.fg, DEFAULT_ANNOUNCEMENT.fg),
  };
}
