import Link from "next/link";
import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white text-black dark:bg-black dark:text-white font-sans relative pt-44 md:pt-48" >

      {/* Logo Section - Overlapping Top Edge */}
      <div className="absolute top-16  left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-black p-4 rounded-full">
        <div className="relative w-40 h-40 md:w-48 md:h-48 border border-neutral-200 dark:border-neutral-800 rounded-full flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-black shadow-2xl shadow-neutral-200/20 dark:shadow-neutral-900/20">
          <h2 className="font-['Pinyon_Script'] text-4xl md:text-5xl mb-2 text-black dark:text-white">Only</h2>
          <h2 className="font-['Pinyon_Script'] text-4xl md:text-5xl text-black dark:text-white">Gods</h2>
          <p className="text-[10px] tracking-widest mt-2 uppercase font-sans text-neutral-400">Be Divine</p>
        </div>
      </div>

      <div className="container mx-auto px-2 md:px-6 pb-8">

        {/* Horizontal Navigation */}
        <nav className="mb-10 px-0 md:px-4 mt-12">
          <ul className="flex flex-wrap justify-center gap-6 md:gap-12 text-xs md:text-sm tracking-[0.15em] uppercase font-medium text-neutral-400">
            <li><Link href="/about" className="hover:text-black dark:hover:text-white transition-colors duration-300">About Us</Link></li>
            <li><span className="text-neutral-300 dark:text-neutral-800 mx-2 hidden md:inline">|</span></li>
            <li><Link href="/events" className="hover:text-black dark:hover:text-white transition-colors duration-300">Events</Link></li>
            <li><span className="text-neutral-300 dark:text-neutral-800 mx-2 hidden md:inline">|</span></li>
            <li><Link href="/consultations" className="hover:text-black dark:hover:text-white transition-colors duration-300">Consultations</Link></li>
            <li><span className="text-neutral-300 dark:text-neutral-800 mx-2 hidden md:inline">|</span></li>
            <li><Link href="/community" className="hover:text-black dark:hover:text-white transition-colors duration-300">Our Community</Link></li>
            <li><span className="text-neutral-300 dark:text-neutral-800 mx-2 hidden md:inline">|</span></li>
            <li><Link href="/faq" className="hover:text-black dark:hover:text-white transition-colors duration-300">FAQ</Link></li>
          </ul>
        </nav>

        {/* Separator */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 mb-8 md:mb-12"></div>

        {/* 3 Column Details - Side by Side on Mobile */}
        <div className="grid grid-cols-[1.4fr_0.9fr_0.7fr] md:grid-cols-3 gap-0 md:gap-4 mb-12 text-left md:text-center w-full">

          {/* Contact */}
          <div className="flex flex-col items-start md:items-center border-r border-neutral-200 dark:border-neutral-800 pr-3 md:px-4">
            <h4 className="text-[18px] md:text-xl tracking-[0.2em] uppercase mb-4 md:mb-6 font-bold text-black dark:text-white">Contact</h4>
            <div className="space-y-1 md:space-y-2 text-[16px] md:text-lg leading-relaxed text-neutral-400 break-words w-full">
              <p>+91 90005 49009</p>
              <p className="whitespace-nowrap">info@onlygods.com</p>
              <div className="mt-2 md:mt-4">
                <p className="">Vijayawada, Andhra Pradesh</p>
                <p className="">India</p>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="flex flex-col items-start md:items-center border-r border-neutral-200 dark:border-neutral-800 px-3 md:px-4">
            <h4 className="text-[18px] md:text-xl tracking-[0.2em] uppercase mb-4 md:mb-6 font-bold text-black dark:text-white">Hours</h4>
            <div className="space-y-2 md:space-y-3 text-[16px] md:text-lg leading-relaxed text-neutral-400 w-full">
              <p className="italic font-serif text-neutral-500">*by appt</p>
              <div className="flex flex-col gap-1 w-full">
                <p className="whitespace-nowrap"><span className="font-medium text-neutral-800 dark:text-neutral-300">Tues-Fri</span> | 11-5</p>
                <p className="whitespace-nowrap"><span className="font-medium text-neutral-800 dark:text-neutral-300">Wed & Sat</span> | 11-7</p>
              </div>
              <p className="text-[10px] md:text-sm uppercase mt-2 text-neutral-600 tracking-wider">Closed Sun-Mon</p>
            </div>
          </div>

          {/* Information */}
          <div className="flex flex-col items-start md:items-center pl-3 md:px-4">
            <h4 className="text-[18px] md:text-xl tracking-[0.2em] uppercase mb-4 md:mb-6 font-bold text-black dark:text-white">Info</h4>
            <ul className="space-y-2 text-[16px] md:text-lg text-neutral-400">
              <li><Link href="/contact" className="hover:text-black dark:hover:text-white transition-colors duration-300">Contact</Link></li>
              <li><Link href="/shop" className="hover:text-black dark:hover:text-white transition-colors duration-300">Shop</Link></li>
              <li><Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors duration-300">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-black dark:hover:text-white transition-colors duration-300">Privacy</Link></li>
            </ul>
          </div>

        </div>

        {/* Separator */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 mb-12"></div>

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 lg:gap-20">

          {/* Socials - Left on Desktop */}
          <div className="flex flex-col items-center lg:items-start">
            <p className="font-['Pinyon_Script'] text-3xl md:text-4xl mb-4 text-black dark:text-white">Let's connect</p>
            <div className="flex gap-6">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="text-neutral-500 hover:text-black dark:hover:text-white hover:scale-110 transition-all duration-300">
                  <Icon size={22} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Connect / Newsletter - Right on Desktop */}
          <div className="flex flex-col items-center lg:items-end w-full max-w-md">
            <p className="text-[10px] uppercase tracking-[0.2em] mb-4 text-neutral-400">Stay in the know with Only Gods:</p>
            <div className="relative w-full">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-800 px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors placeholder-neutral-400 dark:placeholder-neutral-600"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
            © 2026 Only Gods. All rights reserved.
          </p>
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-2">
            Designed and developed by <a href="http://lavishstar.in/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400 transition-colors duration-300">Lavishstar Technologies</a>
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
