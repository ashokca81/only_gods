'use client';

import Link from "next/link";
import { Instagram, Twitter, Facebook } from "lucide-react";
import FooterSubscribe from "./FooterSubscribe";
import { useFooter } from "@/hooks/useFooter";

const Footer = () => {
  const f = useFooter();
  const socials = [
    { Icon: Facebook, href: f.facebook },
    { Icon: Instagram, href: f.instagram },
    { Icon: Twitter, href: f.twitter },
  ];

  return (
    <footer className="bg-white text-black dark:bg-black dark:text-white font-sans relative mt-[101px] md:mt-[130px] pt-44 md:pt-48" >

      {/* Thin grey top line that arcs over the round logo badge */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-end pointer-events-none">
        <div className="flex-1 h-px bg-neutral-300 dark:bg-neutral-700" />
        <div className="shrink-0 w-[200px] h-[100px] md:w-[232px] md:h-[116px] rounded-t-full border-t border-neutral-300 dark:border-neutral-700" />
        <div className="flex-1 h-px bg-neutral-300 dark:bg-neutral-700" />
      </div>

      {/* Logo Section - Overlapping Top Edge */}
      <div className="absolute top-16  left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-black p-4 rounded-full">
        <div className="relative w-40 h-40 md:w-48 md:h-48 border-2 border-black/15 dark:border-white/25 rounded-full flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-black shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <h2 className="font-['Pinyon_Script'] text-4xl md:text-5xl mb-2 text-black dark:text-white">{f.brandLine1}</h2>
          <h2 className="font-['Pinyon_Script'] text-4xl md:text-5xl text-black dark:text-white">{f.brandLine2}</h2>
          <p className="text-[10px] tracking-widest mt-2 uppercase font-sans text-neutral-400">{f.tagline}</p>
        </div>
      </div>

      <div className="container mx-auto px-2 md:px-6 pb-8">

        {/* Horizontal Navigation */}
        <nav className="mb-10 px-0 md:px-4 mt-12">
          <ul className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 md:gap-x-6 text-xs md:text-sm tracking-[0.15em] uppercase font-medium text-neutral-400">
            {f.navLinks.map((l, i) => (
              <li key={i} className="flex items-center">
                {i > 0 && <span className="text-neutral-300 dark:text-neutral-800 mr-4 md:mr-6 hidden md:inline">|</span>}
                <Link href={l.href} className="hover:text-black dark:hover:text-white transition-colors duration-300">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Separator */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 mb-12"></div>

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 lg:gap-20">

          {/* Socials */}
          <div className="flex flex-col items-center lg:items-start">
            <p className="font-['Pinyon_Script'] text-3xl md:text-4xl mb-4 text-black dark:text-white">{f.socialHeading}</p>
            <div className="flex gap-6">
              {socials.map(({ Icon, href }, i) => (
                <a key={i} href={href || '#'} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-black dark:hover:text-white hover:scale-110 transition-all duration-300">
                  <Icon size={22} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col items-center lg:items-end w-full max-w-md">
            <p className="text-[10px] uppercase tracking-[0.2em] mb-4 text-neutral-400">{f.newsletterHeading}</p>
            <FooterSubscribe />
          </div>

        </div>

        {/* Legal links + Copyright */}
        <div className="mt-16 text-center">
          {f.legalLinks.length > 0 && (
            <ul className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 mb-4 text-[10px] uppercase tracking-wider text-neutral-400">
              {f.legalLinks.map((l, i) => (
                <li key={i} className="flex items-center">
                  {i > 0 && <span className="text-neutral-300 dark:text-neutral-800 mr-3">·</span>}
                  <Link href={l.href} className="hover:text-black dark:hover:text-white transition-colors duration-300">{l.label}</Link>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">{f.copyright}</p>
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-2">
            Designed and developed by <a href="http://lavishstar.in/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400 transition-colors duration-300">Lavishstar Technologies</a>
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
