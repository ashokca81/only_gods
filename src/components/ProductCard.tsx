'use client';

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const [liked, setLiked] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [animType, setAnimType] = useState<"slide" | "fade">("fade");

  const productImages = [
    product.image,
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1520975954732-57dd22299614?q=80&w=800&auto=format&fit=crop"
  ];

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimType("slide");
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimType("slide");
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  };

  const handleMouseEnter = () => {
    if (currentIndex === 0 && productImages.length > 1) {
      setAnimType("fade");
      setCurrentIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setAnimType("fade");
    setCurrentIndex(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-secondary aspect-[3/4]">
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
              <img
                src={productImages[currentIndex]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
            </motion.div>
          </AnimatePresence>

          {/* Carousel Navigation Arrows */}
          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
            <button 
              onClick={prevImage}
              className="w-8 h-8 rounded-full bg-black/20 dark:bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/40 dark:hover:bg-white/40 transition-colors pointer-events-auto"
            >
              <ChevronLeft size={20} className="text-white drop-shadow-md" />
            </button>
            <button 
              onClick={nextImage}
              className="w-8 h-8 rounded-full bg-black/20 dark:bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/40 dark:hover:bg-white/40 transition-colors pointer-events-auto"
            >
              <ChevronRight size={20} className="text-white drop-shadow-md" />
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="absolute bottom-[4.5rem] left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
            {productImages.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full drop-shadow-md transition-all duration-300 ${
                  idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
                }`} 
              />
            ))}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-all duration-500" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.newArrival && (
              <span className="px-3 py-1 bg-foreground text-background text-[10px] tracking-[0.15em] uppercase font-semibold rounded-full">
                New
              </span>
            )}
            {product.originalPrice && (
              <span className="px-3 py-1 bg-destructive text-destructive-foreground text-[10px] tracking-[0.15em] uppercase font-semibold rounded-full">
                Sale
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                setLiked(!liked);
              }}
              className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${liked ? "bg-foreground text-background" : "bg-background/80 text-foreground hover:bg-background"
                }`}
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Quick Add */}
          <motion.div
            initial={false}
            className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          >
            <button
              onClick={(e) => e.preventDefault()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-foreground text-background text-xs tracking-[0.15em] uppercase font-semibold rounded-xl hover:bg-foreground/90 transition-colors"
            >
              <ShoppingBag size={14} />
              Quick Add
            </button>
          </motion.div>
        </div>
      </Link>

      {/* Info */}
      <div className="mt-4 px-1">
        <p className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
          {product.category}
        </p>
        <Link href={`/product/${product.id}`}>
          <h3 className="text-sm font-medium text-foreground hover:opacity-70 transition-opacity">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-semibold text-foreground">₹{product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
