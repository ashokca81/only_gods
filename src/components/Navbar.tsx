'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Home, Layers, Info, Sun, Moon, Plus } from "lucide-react";
import { useUI } from "@/buffer/UIContext";
import { motion, AnimatePresence } from "framer-motion";
import SearchOverlay from "./SearchOverlay";
import { useTheme } from "next-themes";

const navLinks = [
  { name: "Home", path: "/", icon: Home },
  { name: "Shop", path: "/shop", icon: ShoppingBag },
  { name: "Collections", path: "/collections", icon: Layers },
  { name: "About", path: "/#about", icon: Info },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { openAuthModal } = useUI();
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => document.body.classList.remove("menu-open");
  }, [mobileOpen]);

  const toggleMenu = useCallback(() => setMobileOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMobileOpen(false), []);

  const bgClass = scrolled || !isHome || mobileOpen
    ? "bg-transparent border-transparent lg:bg-white/95 lg:backdrop-blur-md lg:border-black/10 lg:shadow-sm"
    : "bg-transparent border-transparent";

  const textClass = scrolled || !isHome || mobileOpen ? "text-black" : "text-white";

  const isActiveLink = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${bgClass}`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className={`flex items-center justify-between relative transition-all duration-500 ${scrolled ? 'h-12 lg:h-16' : 'h-16 lg:h-20'}`}>

            {/* Left Section: Mobile Menu Toggle / Desktop Nav */}
            <div className="flex items-center">
              {/* Mobile Glassy Pill Toggle (Logo + Menu) */}
              <button
                onClick={toggleMenu}
                className={`lg:hidden relative flex items-center gap-1 p-0.5 pr-2.5 rounded-full transition-all duration-300 backdrop-blur-3xl border shadow-lg ${
                  scrolled || !isHome || mobileOpen 
                    ? "bg-black/10 border-black/20 text-black" 
                    : "bg-white/25 border-white/30 text-white"
                }`}
                style={{ WebkitBackdropFilter: "blur(20px)" }}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                <div className={`w-[24px] h-[24px] shrink-0 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm backdrop-blur-md ${
                  scrolled || !isHome || mobileOpen ? "bg-white/90" : "bg-black/40"
                } ${mobileOpen ? "rotate-45" : ""}`}>
                  <Plus size={14} strokeWidth={2.5} />
                </div>
                
                <div className="relative h-[16px] flex items-center shrink-0">
                  <img
                    src="/dark_logo.png"
                    alt="Only Gods"
                    className={`h-full w-auto object-contain transition-opacity duration-300 ${scrolled || !isHome || mobileOpen ? 'opacity-100 relative' : 'opacity-0 absolute left-0 top-0'}`}
                  />
                  <img
                    src="/logo_white.png"
                    alt="Only Gods"
                    className={`h-full w-auto object-contain transition-opacity duration-300 ${scrolled || !isHome || mobileOpen ? 'opacity-0 absolute left-0 top-0' : 'opacity-100 relative'}`}
                  />
                </div>
              </button>

              {/* Desktop Nav */}
              <nav className="hidden lg:flex items-center gap-10">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.path}
                    className={`text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300 hover:opacity-60 ${textClass}`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Center Section: Logo (Desktop Only) */}
            <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center pointer-events-none z-50">
              <Link href="/" className="flex items-center relative pointer-events-auto transition-all duration-500 h-6 lg:h-7 w-28 lg:w-36">
                <img
                  src="/dark_logo.png"
                  alt="Only Gods"
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-auto object-contain transition-opacity duration-300 ${scrolled || !isHome || mobileOpen ? 'opacity-100' : 'opacity-0'}`}
                />
                <img
                  src="/logo_white.png"
                  alt="Only Gods"
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-auto object-contain transition-opacity duration-300 ${scrolled || !isHome || mobileOpen ? 'opacity-0' : 'opacity-100'}`}
                />
              </Link>
            </div>

            {/* Right Section: Icons */}
            <div className={`flex items-center gap-2 lg:gap-5 ${textClass}`}>
              <button
                onClick={() => setSearchOpen(true)}
                className={`flex items-center justify-center transition-all duration-300 w-8 h-8 lg:w-auto lg:h-auto rounded-full lg:rounded-none backdrop-blur-3xl lg:backdrop-blur-none lg:bg-transparent shadow-lg lg:shadow-none lg:hover:opacity-60 border lg:border-none ${
                  scrolled || !isHome || mobileOpen ? 'bg-black/10 border-black/20 lg:bg-transparent' : 'bg-white/25 border-white/30 lg:bg-transparent'
                }`}
              >
                <Search className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
              
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={`flex items-center justify-center transition-all duration-300 w-8 h-8 lg:w-auto lg:h-auto rounded-full lg:rounded-none backdrop-blur-3xl lg:backdrop-blur-none lg:bg-transparent shadow-lg lg:shadow-none lg:hover:opacity-60 border lg:border-none ${
                    scrolled || !isHome || mobileOpen ? 'bg-black/10 border-black/20 lg:bg-transparent' : 'bg-white/25 border-white/30 lg:bg-transparent'
                  }`}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 lg:w-5 lg:h-5" /> : <Moon className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>
              )}

              <Link href="/wishlist" className="hidden lg:block hover:opacity-60 transition-opacity">
                <Heart size={18} />
              </Link>
              <Link href="/cart" className="hidden lg:block relative hover:opacity-60 transition-opacity">
                <ShoppingBag size={18} />
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-bold">
                  2
                </span>
              </Link>

              <button
                onClick={() => openAuthModal()}
                className="hidden lg:block hover:opacity-60 transition-opacity"
              >
                <User size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Mobile Side Drawer ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Scrim / Backdrop */}
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
              onClick={closeMenu}
              aria-hidden="true"
            />

            {/* Drawer Panel */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[80%] max-w-[320px] bg-black shadow-2xl lg:hidden flex flex-col"
              style={{ borderTopRightRadius: "1.25rem", borderBottomRightRadius: "1.25rem" }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 h-16 border-b border-border">
                <div className="h-8 w-40 relative">
                  <img src="/dark_logo.png" alt="Only Gods" className="h-full w-auto object-contain object-left" />
                </div>
                <button
                  onClick={closeMenu}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
                  aria-label="Close menu"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Nav Links */}
              <nav className="flex-1 overflow-y-auto py-4 px-3">
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActiveLink(link.path);
                    return (
                      <Link
                        key={link.name}
                        href={link.path}
                        onClick={closeMenu}
                        className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${active
                          ? "bg-white text-black"
                          : "text-white hover:bg-white/10"
                          }`}
                      >
                        <Icon
                          size={20}
                          strokeWidth={active ? 2.5 : 1.5}
                          className="flex-shrink-0"
                        />
                        <span className={`text-sm tracking-[0.15em] uppercase ${active ? "font-bold" : "font-medium"}`}>
                          {link.name}
                        </span>

                        {/* Active indicator dot */}
                        {active && (
                          <motion.div
                            layoutId="drawerActiveIndicator"
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              {/* Drawer Footer */}
              <div className="px-6 py-5 border-t border-white/10">
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 text-center">
                  © 2026 Only Gods
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navbar;
