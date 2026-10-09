// Dashboard-editable content pages (About, Events, FAQ, Terms, Privacy, Cookies).
// Each page is stored in the `settings` table under key `page_<slug>`.
// Safe to import from client and server.

export interface PageSection {
  heading: string;
  body: string;
}

export interface PageContent {
  title: string;
  intro: string;
  sections: PageSection[];
}

export const PAGE_SLUGS = ['about', 'events', 'faq', 'terms', 'privacy', 'cookies'] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export function isPageSlug(s: string): s is PageSlug {
  return (PAGE_SLUGS as readonly string[]).includes(s);
}

/** Nav label + path for each page. */
export const PAGE_META: Record<PageSlug, { label: string; href: string }> = {
  about: { label: 'About Us', href: '/about' },
  events: { label: 'Events', href: '/events' },
  faq: { label: 'FAQ', href: '/faq' },
  terms: { label: 'Terms & Conditions', href: '/terms' },
  privacy: { label: 'Privacy Policy', href: '/privacy' },
  cookies: { label: 'Cookies', href: '/cookies' },
};

export const DEFAULT_PAGES: Record<PageSlug, PageContent> = {
  about: {
    title: 'About Us',
    intro: 'ONLY GODS is a premium streetwear label born from the belief that everyone carries something divine. We make considered, limited pieces for those who move to their own rhythm.',
    sections: [
      { heading: 'Our Story', body: 'Founded in Vijayawada, ONLY GODS started as a small studio with a simple idea — clothing that feels as good as it looks, made in small runs so every piece stays special.' },
      { heading: 'Our Craft', body: 'We obsess over fabric, fit and finish. Each drop is designed in-house and produced in limited quantities, so you are never wearing the same thing as everyone else.' },
      { heading: 'Our Promise', body: 'Honest pricing, careful quality checks, and service that treats you like a person — not an order number.' },
    ],
  },
  events: {
    title: 'Events',
    intro: 'Pop-ups, drops and private previews. This is where we meet the community in person.',
    sections: [
      { heading: 'Drop Previews', body: 'Members on our list get first access to new collections before they go live online. Subscribe in the footer to never miss one.' },
      { heading: 'Pop-up Stores', body: 'We host occasional pop-ups across India. Follow us on Instagram for dates and locations.' },
    ],
  },
  faq: {
    title: 'Frequently Asked Questions',
    intro: 'Everything you need to know about ordering, shipping and returns.',
    sections: [
      { heading: 'How long does delivery take?', body: 'Orders are dispatched within 1–2 business days and usually arrive within 4–7 days depending on your location.' },
      { heading: 'What is your return policy?', body: 'You can request a return within 7 days of delivery for unused items in original condition. Start a return from your profile under “My Orders”.' },
      { heading: 'How do I track my order?', body: 'Once your order ships, a tracking link appears in your profile under “My Orders”.' },
      { heading: 'What payment methods do you accept?', body: 'We accept UPI, cards and netbanking via Razorpay, as well as Cash on Delivery where available.' },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'By using this website and placing an order with ONLY GODS, you agree to the terms below.',
    sections: [
      { heading: 'Orders & Pricing', body: 'All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to cancel any order due to pricing errors or stock issues, with a full refund.' },
      { heading: 'Payments', body: 'Payments are processed securely through Razorpay. We do not store your card details on our servers.' },
      { heading: 'Shipping', body: 'We ship across India. Delivery timelines are estimates and may vary due to factors outside our control.' },
      { heading: 'Returns & Refunds', body: 'Eligible returns must be requested within 7 days of delivery. Approved refunds are issued to the original payment method.' },
      { heading: 'Contact', body: 'For any questions about these terms, email us at info@onlygods.com.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'Your privacy matters to us. This policy explains what we collect and how we use it.',
    sections: [
      { heading: 'Information We Collect', body: 'We collect the details you provide — name, phone, email and shipping address — to process your orders, plus basic usage data to improve the site.' },
      { heading: 'How We Use It', body: 'Your information is used to fulfil orders, provide support, and (only if you opt in) send you updates about drops and offers.' },
      { heading: 'Payments', body: 'Payment information is handled directly by our payment partner Razorpay and is never stored on our servers.' },
      { heading: 'Data Sharing', body: 'We do not sell your data. We share it only with partners needed to deliver your order (couriers, payment gateway).' },
      { heading: 'Your Choices', body: 'You can unsubscribe from marketing at any time and request deletion of your account data by emailing info@onlygods.com.' },
    ],
  },
  cookies: {
    title: 'Cookies Policy',
    intro: 'We use cookies to keep the site working and to improve your experience.',
    sections: [
      { heading: 'What Are Cookies', body: 'Cookies are small files stored on your device that help the website remember your preferences and keep you logged in.' },
      { heading: 'How We Use Cookies', body: 'We use essential cookies for cart and login, and optional cookies to understand how the site is used so we can improve it.' },
      { heading: 'Managing Cookies', body: 'You can control or delete cookies through your browser settings. Disabling essential cookies may affect site functionality.' },
    ],
  },
};

/** Normalise a stored settings value into a clean PageContent for the given slug. */
export function mergePageContent(value: unknown, slug: PageSlug): PageContent {
  const d = DEFAULT_PAGES[slug];
  const o = (value ?? {}) as Partial<PageContent>;
  const title = typeof o.title === 'string' && o.title.trim() !== '' ? o.title : d.title;
  const intro = typeof o.intro === 'string' ? o.intro : d.intro;
  const sections = Array.isArray(o.sections)
    ? o.sections
        .map((s) => {
          const so = (s ?? {}) as Partial<PageSection>;
          return {
            heading: typeof so.heading === 'string' ? so.heading : '',
            body: typeof so.body === 'string' ? so.body : '',
          };
        })
        .filter((s) => s.heading.trim() !== '' || s.body.trim() !== '')
    : d.sections;
  return { title, intro, sections };
}
