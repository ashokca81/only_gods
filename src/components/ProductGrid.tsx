'use client';

import { Bookmark, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const mockProducts = [
  { 
    id: 1, 
    name: "Black Wildloom Hoodie", 
    price: "RS. 23,000", 
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop"
    ], 
    hasBookmark: false 
  },
  { 
    id: 2, 
    name: "Brown Star Studded Hoodie", 
    price: "RS. 17,000", 
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506634572416-48cdfe530110?q=80&w=800&auto=format&fit=crop"
    ], 
    hasBookmark: false 
  },
  { 
    id: 3, 
    name: "Grey Star Studded Hoodie", 
    price: "RS. 17,000", 
    images: [
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop"
    ], 
    hasBookmark: false 
  },
  { 
    id: 4, 
    name: "Brown Wildloom Hoodie", 
    price: "RS. 23,000", 
    images: [
      "https://images.unsplash.com/photo-1506634572416-48cdfe530110?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop"
    ], 
    hasBookmark: false 
  },
  { 
    id: 5, 
    name: "Meadow Blue Hoodie", 
    price: "RS. 14,500", 
    images: [
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop"
    ], 
    hasBookmark: true 
  },
  { 
    id: 6, 
    name: "Red Serpent Bloom Zipper Hoodie", 
    price: "RS. 14,000", 
    images: [
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop"
    ], 
    hasBookmark: true 
  },
  { 
    id: 7, 
    name: "Black Poison Petals Zipper Hoodie", 
    price: "RS. 16,000", 
    images: [
      "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop"
    ], 
    hasBookmark: true 
  },
  { 
    id: 8, 
    name: "Black Serpent Bloom Zipper Hoodie", 
    price: "RS. 14,000", 
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506634572416-48cdfe530110?q=80&w=800&auto=format&fit=crop"
    ], 
    hasBookmark: true 
  },
];

const ProductCard = ({ product }: { product: typeof mockProducts[0] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [animType, setAnimType] = useState<"slide" | "fade">("fade");

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimType("slide");
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimType("slide");
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
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
    <div 
      className="group cursor-pointer"
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
            <img
              src={product.images[currentIndex]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Arrows */}
        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={prevImage}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors"
          >
            <ChevronLeft size={20} className="text-white drop-shadow-md" />
          </button>
          <button 
            onClick={nextImage}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors"
          >
            <ChevronRight size={20} className="text-white drop-shadow-md" />
          </button>
        </div>
        
        {/* Bookmark Icon */}
        {product.hasBookmark && (
          <div className="absolute top-3 right-3 text-white drop-shadow-md">
            <Bookmark size={20} fill="white" className="opacity-90" />
          </div>
        )}

        {/* Pagination Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {product.images.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-1.5 h-1.5 rounded-full drop-shadow-md transition-all duration-300 ${
                idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
              }`} 
            />
          ))}
        </div>
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
        <button className="text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white transition-colors mt-0.5">
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

const ProductGrid = () => {
  return (
    <section className="pt-8 pb-4 lg:pt-20 lg:pb-0 bg-white dark:bg-black border-t border-black/10 dark:border-white/10">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-8 border-b border-black/10 dark:border-white/10 pb-4 hidden">
          <div className="flex gap-8">
            <span className="text-sm font-bold uppercase tracking-wider text-black dark:text-white cursor-pointer">New in</span>
            <span className="text-sm font-medium uppercase tracking-wider text-black/50 dark:text-white/50 cursor-pointer hover:text-black dark:hover:text-white transition-colors">Collections</span>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
