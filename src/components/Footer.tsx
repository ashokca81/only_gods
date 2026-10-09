'use client';

import Link from "next/link";
import { Instagram, Twitter, Facebook } from "lucide-react";
import NewsletterSignup from "./NewsletterSignup";
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
    <>
    <NewsletterSignup />
    <footer className="bg-white text-black dark:bg-black dark:text-white font-sans relative pt-44 md:pt-48" >

      {/* Logo Section - Overlapping Top Edge */}
      <div className="absolute top-16  left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-black p-4 rounded-full">
        <div className="relative w-40 h-40 md:w-48 md:h-48 border border-neutral-200 dark:border-neutral-800 rounded-full flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-black shadow-2xl shadow-neutral-200/20 dark:shadow-neutral-900/20">
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
        <div className="border-t border-neutral-200 dark:border-neutral-800 mb-8 md:mb-12"></div>

        {/* 3 Column Details */}
        <div className="grid grid-cols-[1.4fr_0.9fr_0.7fr] md:grid-cols-3 gap-0 md:gap-4 mb-12 text-left md:text-center w-full">

          {/* Contact */}
          <div className="flex flex-col items-start md:items-center border-r border-neutral-200 dark:border-neutral-800 pr-3 md:px-4">
            <h4 className="text-[18px] md:text-xl tracking-[0.2em] uppercase mb-4 md:mb-6 font-bold text-black dark:text-white">{f.contactHeading}</h4>
            <div className="space-y-1 md:space-y-2 text-[16px] md:text-lg leading-relaxed text-neutral-400 break-words w-full">
              {f.phone && <p>{f.phone}</p>}
              {f.email && <p className="whitespace-nowrap">{f.email}</p>}
              {f.addressLines.length > 0 && (
                <div className="mt-2 md:mt-4">
                  {f.addressLines.map((a, i) => <p key={i}>{a}</p>)}
                </div>
              )}
            </div>
          </div>

          {/* Hours */}
          <div className="flex flex-col items-start md:items-center border-r border-neutral-200 dark:border-neutral-800 px-3 md:px-4">
            <h4 className="text-[18px] md:text-xl tracking-[0.2em] uppercase mb-4 md:mb-6 font-bold text-black dark:text-white">{f.hoursHeading}</h4>
            <div className="space-y-2 md:space-y-3 text-[16px] md:text-lg leading-relaxed text-neutral-400 w-full">
              {f.hoursNote && <p className="italic font-serif text-neutral-500">{f.hoursNote}</p>}
              <div className="flex flex-col gap-1 w-full">
                {f.hoursLines.map((line, i) => {
                  const idx = line.indexOf('|');
                  const left = idx >= 0 ? line.slice(0, idx).trim() : line;
                  const right = idx >= 0 ? line.slice(idx + 1).trim() : '';
                  return (
                    <p key={i} className="whitespace-nowrap">
                      <span className="font-medium text-neutral-800 dark:text-neutral-300">{left}</span>
                      {right && <> | {right}</>}
                    </p>
                  );
                })}
              </div>
              {f.hoursClosed && <p className="text-[10px] md:text-sm uppercase mt-2 text-neutral-600 tracking-wider">{f.hoursClosed}</p>}
            </div>
          </div>

          {/* Information */}
          <div className="flex flex-col items-start md:items-center pl-3 md:px-4">
            <h4 className="text-[18px] md:text-xl tracking-[0.2em] uppercase mb-4 md:mb-6 font-bold text-black dark:text-white">{f.infoHeading}</h4>
            <ul className="space-y-2 text-[16px] md:text-lg text-neutral-400">
              {f.infoLinks.map((l, i) => (
                <li key={i}><Link href={l.href} className="hover:text-black dark:hover:text-white transition-colors duration-300">{l.label}</Link></li>
              ))}
            </ul>
          </div>

        </div>

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
    </>
  );
};

export default Footer;
