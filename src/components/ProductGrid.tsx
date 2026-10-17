'use client';

import Link from "next/link";
import { Bookmark, Plus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/useProducts";
import { useHomeProducts } from "@/hooks/useHomeProducts";
import { formatPrice } from "@/lib/format";
import { useCustomer } from "@/buffer/CustomerContext";
import { useUI } from "@/buffer/UIContext";
import { toast } from "sonner";

interface GridItem {
  id: string;
  name: string;
  price: string;
  images: string[];
  hasBookmark: boolean;
}

const ProductCard = ({ product }: { product: GridItem }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction] = useState(0);
  const [animType, setAnimType] = useState<"slide" | "fade">("fade");
  const { isWishlisted, toggleWishlist } = useCustomer();
  const { openAuthModal } = useUI();
  const wished = isWishlisted(product.id);

  const onWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = await toggleWishlist(product.id);
    if (r === "login") { openAuthModal(); toast.error("Please log in to save favourites"); }
    else toast.success(r === "added" ? "Added to favourites ♡" : "Removed from favourites");
  };

  const handleMouseEnter = () => {
    if (currentIndex === 0 && product.images.length > 1) {
      setAnimType("fade");
      setCurrentIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setAnimType("fade");
    setCurrentIndex(0);
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="group cursor-pointer block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-900 mb-3 rounded-md">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={animType === "slide"
              ? { x: direction > 0 ? "100%" : "-100%", opacity: 1, scale: 1 }
              : { opacity: 0, scale: 1.1, x: 0 }
            }
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={animType === "slide"
              ? { x: direction < 0 ? "100%" : "-100%", opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.95, x: 0 }
            }
            transition={{ type: "tween", ease: "easeInOut", duration: 0.4 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images[currentIndex]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </motion.div>
        </AnimatePresence>

        {/* Wishlist ribbon — frosted glass + auto-contrast (white on dark photos, black on light) */}
        <button
          type="button"
          onClick={onWishlist}
          aria-label={wished ? "Remove from favourites" : "Add to favourites"}
          className={`absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-3xl bg-white/15 shadow-lg hover:bg-white/25 transition-all duration-300 ${wished ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`}
          style={{ WebkitBackdropFilter: "blur(24px)" }}
        >
          {/* border + icon invert against the photo behind for contrast on any colour */}
          <span className="absolute inset-0 rounded-full border-2 border-white mix-blend-difference pointer-events-none" />
          <Bookmark size={16} className="relative mix-blend-difference text-white" fill={wished ? "white" : "none"} />
        </button>

      </div>

      {/* Product Info */}
      <div className="flex justify-between items-start pt-1">
        <div className="flex flex-col gap-0.5 max-w-[85%]">
          <h3 className="text-[10px] md:text-xs font-bold text-black dark:text-white uppercase tracking-wider truncate">
            {product.name}
          </h3>
          <p className="text-[10px] md:text-xs font-medium text-black/70 dark:text-white/70">
            {product.price}
          </p>
        </div>
        <button
          onClick={(e) => e.preventDefault()}
          className="text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white transition-colors mt-0.5"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </Link>
  );
};

const ProductGrid = () => {
  const { data: products } = useProducts();
  const pickedIds = useHomeProducts();

  // Admin-picked products (in order); fall back to all products when none chosen.
  const chosen =
    pickedIds.length > 0
      ? pickedIds.map((id) => products.find((p) => p.id === id)).filter((p): p is (typeof products)[number] => !!p)
      : products;

  const items: GridItem[] = chosen.map((p) => ({
    id: p.id,
    name: p.name,
    price: formatPrice(p.price),
    images: p.images && p.images.length > 0 ? p.images : [p.image],
    hasBookmark: !!p.newArrival,
  }));

  return (
    <section className="pt-8 pb-4 lg:pt-20 lg:pb-0 bg-white dark:bg-black border-t-0 lg:border-t border-black/10 dark:border-white/10">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
