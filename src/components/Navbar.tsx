'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Home, Layers, Info, Sun, Moon } from "lucide-react";
import { useUI } from "@/buffer/UIContext";
import { useCart } from "@/buffer/CartContext";
import { useCustomer } from "@/buffer/CustomerContext";
import { useRouter } from "next/navigation";
import SearchOverlay from "./SearchOverlay";
import { useTheme } from "next-themes";
import { useAutoContrast } from "@/hooks/useAutoContrast";
import { OVERRIDE_KEY } from "@/lib/themeSchedule";

const navLinks = [
  { name: "Home", path: "/", icon: Home },
  { name: "Shop", path: "/shop", icon: ShoppingBag },
  { name: "Collections", path: "/collections", icon: Layers },
  { name: "About", path: "/#about", icon: Info },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { openAuthModal } = useUI();
  const { count } = useCart();
  const { customer, wishlistIds } = useCustomer();
  const wishCount = wishlistIds.size;
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  // Auto-contrast for the mobile glassy icons/logo: white over dark bg, black over light.
  const navTheme = useAutoContrast('top');
  const darkBehind = navTheme === 'dark';

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bgClass = scrolled || !isHome
    ? "bg-transparent border-transparent lg:bg-white/95 lg:backdrop-blur-md lg:border-black/10 lg:shadow-sm dark:lg:bg-black/95 dark:lg:border-white/10"
    : "bg-transparent border-transparent";

  const textClass = scrolled || !isHome ? "text-black dark:text-white" : "text-white";

  // Manual theme flip: remember it so the auto-schedule respects it for ~1 hour.
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify({ theme: next, at: Date.now() })); } catch {}
    setTheme(next);
  };

  return (
    <>
      <header data-nav-ignore style={{ top: 'var(--annc-h, 0px)' }} className={`fixed left-0 right-0 z-50 border-b transition-all duration-500 ${bgClass}`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className={`flex items-center justify-between relative transition-all duration-500 ${scrolled ? 'h-12 lg:h-16' : 'h-16 lg:h-20'}`}>

            {/* Left Section: Mobile Logo Pill / Desktop Nav */}
            <div className="flex items-center">
              {/* Mobile Glassy Logo Pill (links home — no side drawer) */}
              <Link
                href="/"
                aria-label="Only Gods — home"
                className={`lg:hidden relative flex items-center py-1.5 px-3.5 rounded-full backdrop-blur-3xl border shadow-lg transition-colors duration-300 ${darkBehind ? "bg-white/15 border-white/25 text-white" : "bg-black/5 border-black/15 text-black"}`}
                style={{ WebkitBackdropFilter: "blur(20px)" }}
              >
                <img
                  src={darkBehind ? "/logo_white.png" : "/dark_logo.png"}
                  alt="Only Gods"
                  className="h-[16px] w-auto object-contain shrink-0 transition-opacity duration-300"
                />
              </Link>

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
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-auto object-contain transition-opacity duration-300 ${scrolled || !isHome ? 'opacity-100 dark:opacity-0' : 'opacity-0'}`}
                />
                <img
                  src="/logo_white.png"
                  alt="Only Gods"
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-auto object-contain transition-opacity duration-300 ${scrolled || !isHome ? 'opacity-0 dark:opacity-100' : 'opacity-100'}`}
                />
              </Link>
            </div>

            {/* Right Section: Icons */}
            <div className={`flex items-center gap-2 lg:gap-5 ${textClass}`}>
              <button
                onClick={() => setSearchOpen(true)}
                className={`flex items-center justify-center transition-all duration-300 w-8 h-8 lg:w-auto lg:h-auto rounded-full lg:rounded-none backdrop-blur-3xl lg:backdrop-blur-none lg:bg-transparent shadow-lg lg:shadow-none lg:hover:opacity-60 border lg:border-none ${darkBehind ? 'bg-white/15 border-white/25 text-white' : 'bg-black/5 border-black/15 text-black'} lg:bg-transparent lg:text-current`}
              >
                <Search className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>

              {mounted && (
                <button
                  onClick={toggleTheme}
                  className={`flex items-center justify-center transition-all duration-300 w-8 h-8 lg:w-auto lg:h-auto rounded-full lg:rounded-none backdrop-blur-3xl lg:backdrop-blur-none lg:bg-transparent shadow-lg lg:shadow-none lg:hover:opacity-60 border lg:border-none ${darkBehind ? 'bg-white/15 border-white/25 text-white' : 'bg-black/5 border-black/15 text-black'} lg:bg-transparent lg:text-current`}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 lg:w-5 lg:h-5" /> : <Moon className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>
              )}

              <Link href="/wishlist" className="hidden lg:block relative hover:opacity-60 transition-opacity">
                <Heart size={18} />
                {wishCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-bold">
                    {wishCount}
                  </span>
                )}
              </Link>
              <Link href="/cart" className="hidden lg:block relative hover:opacity-60 transition-opacity">
                <ShoppingBag size={18} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-bold">
                    {count}
                  </span>
                )}
              </Link>

              <button
                onClick={() => (customer ? router.push('/profile') : openAuthModal())}
                className="hidden lg:block hover:opacity-60 transition-opacity"
                title={customer ? 'My account' : 'Login'}
              >
                <User size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navbar;
