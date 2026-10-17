'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Heart, ShoppingBag, User } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useUI } from "@/buffer/UIContext";
import { useCart } from "@/buffer/CartContext";
import { useCustomer } from "@/buffer/CustomerContext";
import { useAutoContrast } from "@/hooks/useAutoContrast";

const tabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: LayoutGrid, label: "Shop", path: "/shop" },
  { icon: Heart, label: "Wishlist", path: "/wishlist" },
  { icon: ShoppingBag, label: "Cart", path: "/cart" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const { openAuthModal } = useUI();
  const { count } = useCart();
  const { customer, wishlistIds } = useCustomer();
  const wishCount = wishlistIds.size;
  const pathname = usePathname();
  const dark = useAutoContrast('bottom') === 'dark'; // dark bg behind the bar → white icons

  // Hide the bar while scrolling down, show it again when scrolling up.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > last && y > 80) setHidden(true);
      else if (y < last) setHidden(false);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null;
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <div data-nav-ignore className={`fixed bottom-6 left-0 right-0 z-50 lg:hidden safe-bottom flex justify-center pointer-events-none px-4 transition-all duration-300 ${hidden ? 'translate-y-[150%] opacity-0' : 'translate-y-0 opacity-100'}`}>
      <nav
        className="bg-black/5 dark:bg-white/10 backdrop-blur-2xl border border-black/10 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(255,255,255,0.05)] rounded-[2rem] pointer-events-auto w-full max-w-[380px]"
        style={{ WebkitBackdropFilter: "blur(24px)" }}
      >
        <div className="flex items-center justify-around h-[4.5rem] px-2 relative">
          {tabs.map(({ icon: Icon, label, path }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                href={path}
                onClick={(e) => {
                  if (path === "/profile" && !customer) {
                    e.preventDefault();
                    openAuthModal();
                  }
                }}
                className="relative flex flex-col items-center justify-center w-full h-full gap-1"
              >
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className={`absolute top-1 w-8 h-1 rounded-full ${dark ? "bg-white" : "bg-black"}`}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative mt-1">
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.5}
                    className={`transition-colors duration-200 ${dark ? (active ? "text-white" : "text-white/55") : (active ? "text-black" : "text-black/50")}`}
                  />
                  {label === "Cart" && count > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-[9px] font-bold flex items-center justify-center">
                      {count}
                    </span>
                  )}
                  {label === "Wishlist" && wishCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-[9px] font-bold flex items-center justify-center">
                      {wishCount}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[10px] tracking-wide transition-colors duration-200 ${dark ? (active ? "text-white font-bold" : "text-white/55") : (active ? "text-black font-bold" : "text-black/50")
                    }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;

