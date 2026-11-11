'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { mergeHero, type HeroConfig } from "@/lib/hero";
import { useSetting } from "@/hooks/useSetting";

function Media({
  type,
  url,
  poster,
  className,
}: {
  type: HeroConfig['desktopType'];
  url: string;
  poster: string;
  className: string;
}) {
  if (!url) return null; // nothing set → no placeholder media
  if (type === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="Hero background" className={className} />;
  }
  return (
    <video
      key={url}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster={poster}
      className={className}
    >
      <source src={url} type="video/mp4" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="Hero background" className="w-full h-full object-cover" />
    </video>
  );
}

const Hero = () => {
  // Nothing (no media, no title, no button) renders until the admin's real
  // setting is known — never a built-in "Only Gods" text. Cached, so returning
  // to the home page paints the image in the very first frame.
  const loaded = useSetting<HeroConfig>('/api/settings/hero', (j) => mergeHero((j as { hero?: unknown })?.hero));
  const ready = loaded !== null;
  const hero: HeroConfig = loaded ?? mergeHero({ titleDesktopShow: false, titleMobileShow: false });

  // Title look (all defaults = the original design).
  const mobileText = hero.titleMobile.trim() || hero.title;
  const anyTitle = hero.titleDesktopShow || hero.titleMobileShow;
  const align = hero.titlePosition === 'top' ? 'items-start pt-16 lg:pt-24' : hero.titlePosition === 'bottom' ? 'items-end pb-24 lg:pb-32' : 'items-center';
  const styleCls = hero.titleStyle === 'overlay' ? 'mix-blend-overlay' : '';
  const titleStyle = {
    '--hs': String(hero.titleSize / 100),
    color: hero.titleStyle === 'outline' ? 'transparent' : hero.titleColor,
    WebkitTextStroke: hero.titleStyle === 'outline' ? `2px ${hero.titleColor}` : undefined,
  } as React.CSSProperties;

  return (
    <section data-nav="dark" className={`relative w-full h-[calc(100svh-4rem)] lg:h-screen overflow-hidden bg-black flex justify-center ${align}`}>

      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        {ready && (
          <>
            {/* Mobile — dimmed only while the title is shown */}
            <Media
              type={hero.mobileType}
              url={hero.mobileUrl}
              poster={hero.mobilePoster}
              className={`md:hidden w-full h-full object-cover scale-105 ${hero.titleMobileShow ? 'opacity-60' : ''}`}
            />
            {/* Desktop */}
            <Media
              type={hero.desktopType}
              url={hero.desktopUrl}
              poster={hero.desktopPoster}
              className={`hidden md:block w-full h-full object-cover scale-105 ${hero.titleDesktopShow ? 'md:opacity-60' : ''}`}
            />
          </>
        )}
        {/* Tint gradient — per device, only while the title is shown */}
        <div className={`absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 ${hero.titleMobileShow ? '' : 'hidden'} ${hero.titleDesktopShow ? 'md:block' : 'md:hidden'}`} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full container mx-auto px-4 flex flex-col items-center justify-center text-center pt-20">

        {ready && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <h1
            style={titleStyle}
            className={`${anyTitle ? '' : 'sr-only'} whitespace-nowrap text-[calc(10.4vw*var(--hs))] sm:text-[calc(9.4vw*var(--hs))] md:text-[calc(10.4vw*var(--hs))] lg:text-[calc(11.3vw*var(--hs))] leading-[0.85] font-black ${styleCls} tracking-[0.1em] md:tracking-[0.15em] font-display uppercase`}
          >
            <span className={hero.titleMobileShow ? 'md:hidden' : 'hidden'}>{mobileText}</span>
            <span className={hero.titleDesktopShow ? 'hidden md:inline' : 'hidden'}>{hero.title}</span>
            {!anyTitle && hero.title}
          </h1>
        </motion.div>
        )}

      </div>

      {ready && hero.cta.trim() !== '' && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="absolute bottom-0 left-0 w-full flex justify-center z-20"
      >
        <Link
          href={hero.ctaLink || '/shop'}
          className="inline-block group text-white px-6 py-3 md:px-8 md:py-4 text-[10px] md:text-base font-black uppercase tracking-[0.25em] hover:text-white/70 transition-all duration-300 hover:scale-105 drop-shadow-xl [text-shadow:0_1px_8px_rgba(0,0,0,0.75)]"
        >
          {hero.cta}
        </Link>
      </motion.div>
      )}

    </section>
  );
};

export default Hero;
