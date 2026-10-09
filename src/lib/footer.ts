// Dashboard-editable footer content. Stored in `settings` under key `footer`.
// Safe to import from client and server.

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterConfig {
  brandLine1: string;
  brandLine2: string;
  tagline: string;
  navLinks: FooterLink[];
  contactHeading: string;
  phone: string;
  email: string;
  addressLines: string[];
  hoursHeading: string;
  hoursNote: string;
  hoursLines: string[];
  hoursClosed: string;
  infoHeading: string;
  infoLinks: FooterLink[];
  socialHeading: string;
  facebook: string;
  instagram: string;
  twitter: string;
  newsletterHeading: string;
  legalLinks: FooterLink[];
  copyright: string;
}

export const DEFAULT_FOOTER: FooterConfig = {
  brandLine1: 'Only',
  brandLine2: 'Gods',
  tagline: 'Be Divine',
  navLinks: [
    { label: 'About Us', href: '/about' },
    { label: 'Events', href: '/events' },
    { label: 'FAQ', href: '/faq' },
  ],
  contactHeading: 'Contact',
  phone: '+91 90005 49009',
  email: 'info@onlygods.com',
  addressLines: ['Vijayawada, Andhra Pradesh', 'India'],
  hoursHeading: 'Hours',
  hoursNote: '*by appt',
  hoursLines: ['Tues-Fri | 11-5', 'Wed & Sat | 11-7'],
  hoursClosed: 'Closed Sun-Mon',
  infoHeading: 'Info',
  infoLinks: [
    { label: 'Contact', href: '/contact' },
    { label: 'Shop', href: '/shop' },
    { label: 'FAQ', href: '/faq' },
  ],
  socialHeading: "Let's connect",
  facebook: '#',
  instagram: '#',
  twitter: '#',
  newsletterHeading: 'Stay in the know with Only Gods:',
  legalLinks: [
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Cookies', href: '/cookies' },
  ],
  copyright: '© 2026 Only Gods. All rights reserved.',
};

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}
function strArr(v: unknown, fallback: string[]): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : fallback;
}
function linkArr(v: unknown, fallback: FooterLink[]): FooterLink[] {
  if (!Array.isArray(v)) return fallback;
  const out: FooterLink[] = [];
  for (const l of v) {
    const o = (l ?? {}) as Partial<FooterLink>;
    const label = typeof o.label === 'string' ? o.label.trim() : '';
    if (!label) continue;
    out.push({ label, href: typeof o.href === 'string' && o.href.trim() !== '' ? o.href.trim() : '#' });
  }
  return out;
}

export function mergeFooter(value: unknown): FooterConfig {
  const o = (value ?? {}) as Partial<FooterConfig>;
  const d = DEFAULT_FOOTER;
  return {
    brandLine1: str(o.brandLine1, d.brandLine1),
    brandLine2: str(o.brandLine2, d.brandLine2),
    tagline: str(o.tagline, d.tagline),
    navLinks: linkArr(o.navLinks, d.navLinks),
    contactHeading: str(o.contactHeading, d.contactHeading),
    phone: str(o.phone, d.phone),
    email: str(o.email, d.email),
    addressLines: strArr(o.addressLines, d.addressLines),
    hoursHeading: str(o.hoursHeading, d.hoursHeading),
    hoursNote: str(o.hoursNote, d.hoursNote),
    hoursLines: strArr(o.hoursLines, d.hoursLines),
    hoursClosed: str(o.hoursClosed, d.hoursClosed),
    infoHeading: str(o.infoHeading, d.infoHeading),
    infoLinks: linkArr(o.infoLinks, d.infoLinks),
    socialHeading: str(o.socialHeading, d.socialHeading),
    facebook: str(o.facebook, d.facebook),
    instagram: str(o.instagram, d.instagram),
    twitter: str(o.twitter, d.twitter),
    newsletterHeading: str(o.newsletterHeading, d.newsletterHeading),
    legalLinks: linkArr(o.legalLinks, d.legalLinks),
    copyright: str(o.copyright, d.copyright),
  };
}
