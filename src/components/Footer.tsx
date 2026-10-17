'use client';

import Link from "next/link";
import FooterSubscribe from "./FooterSubscribe";
import { useFooter } from "@/hooks/useFooter";
import { SOCIAL_ICONS } from "@/lib/socialIcons";

const Footer = () => {
  const f = useFooter();
  const socials = f.socials.filter((s) => s.enabled && SOCIAL_ICONS[s.icon]);

  return (
    <footer className="bg-white text-black dark:bg-black dark:text-white font-sans relative mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800">

      <div className="container mx-auto px-2 md:px-6 pb-8">

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 lg:gap-20">

          {/* Socials */}
          <div className="flex flex-col items-center lg:items-start">
            <p className="font-['Pinyon_Script'] text-3xl md:text-4xl mb-4 text-black dark:text-white">{f.socialHeading}</p>
            <div className="flex gap-6">
              {socials.map((s, i) => {
                const Icon = SOCIAL_ICONS[s.icon];
                return (
                  <a key={i} href={s.href || '#'} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-black dark:hover:text-white hover:scale-110 transition-all duration-300">
                    <Icon size={22} strokeWidth={1.5} />
                  </a>
                );
              })}
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
