'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Heart, ShoppingBag, User } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useUI } from "@/buffer/UIContext";

const tabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: LayoutGrid, label: "Shop", path: "/shop" },
  { icon: Heart, label: "Wishlist", path: "/wishlist" },
  { icon: ShoppingBag, label: "Cart", path: "/cart" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const { openAuthModal } = useUI();
  const pathname = usePathname();
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 lg:hidden safe-bottom flex justify-center pointer-events-none px-4">
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
                  if (path === "/profile") {
                    e.preventDefault();
                    openAuthModal();
                  }
                }}
                className="relative flex flex-col items-center justify-center w-full h-full gap-1"
              >
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-1 w-8 h-1 rounded-full bg-black dark:bg-white"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.5}
                  className={`transition-colors duration-200 mt-1 ${active ? "text-black dark:text-white" : "text-black/50 dark:text-white/50"}`}
                />
                <span
                  className={`text-[10px] tracking-wide transition-colors duration-200 ${active ? "text-black dark:text-white font-bold" : "text-black/50 dark:text-white/50"
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

