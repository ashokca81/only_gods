'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DEFAULT_HERO, type HeroConfig } from "@/lib/hero";

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
  const [hero, setHero] = useState<HeroConfig>(DEFAULT_HERO);

  useEffect(() => {
    let alive = true;
    fetch('/api/settings/hero')
      .then((r) => r.json())
      .then((j) => { if (alive && j?.hero) setHero(j.hero as HeroConfig); })
      .catch(() => { /* keep defaults */ });
    return () => { alive = false; };
  }, []);

  return (
    <section className="relative w-full h-[calc(100svh-4rem)] lg:h-screen overflow-hidden bg-black flex items-center justify-center">

      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        {/* Mobile */}
        <Media
          type={hero.mobileType}
          url={hero.mobileUrl}
          poster={hero.mobilePoster}
          className="md:hidden w-full h-full object-cover opacity-60 scale-105"
        />
        {/* Desktop */}
        <Media
          type={hero.desktopType}
          url={hero.desktopUrl}
          poster={hero.desktopPoster}
          className="hidden md:block w-full h-full object-cover opacity-60 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full container mx-auto px-4 flex flex-col items-center justify-center text-center pt-20">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <h1 className="whitespace-nowrap text-[10.4vw] sm:text-[9.4vw] md:text-[10.4vw] lg:text-[11.3vw] leading-[0.85] font-black text-white mix-blend-overlay tracking-[0.1em] md:tracking-[0.15em] font-display uppercase">
            {hero.title}
          </h1>
        </motion.div>

      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="absolute bottom-0 left-0 w-full flex justify-center z-20"
      >
        <Link
          href={hero.ctaLink || '/shop'}
          className="inline-block group text-white px-6 py-3 md:px-8 md:py-4 text-[10px] md:text-base font-black uppercase tracking-[0.25em] hover:text-white/70 transition-all duration-300 hover:scale-105 drop-shadow-xl"
        >
          {hero.cta}
        </Link>
      </motion.div>

    </section>
  );
};

export default Hero;
