'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface CategoryCardProps {
  name: string;
  image: string;
  count: number;
  index?: number;
  href?: string;
  className?: string;
}

const CategoryCard = ({ name, image, count, index = 0, href = "/shop", className = "" }: CategoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={className}
    >
      <Link href={href} className="group block relative overflow-hidden h-full w-full">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

        <div className="absolute inset-0 p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-white/60 text-xs font-bold tracking-[0.2em]">{String(index + 1).padStart(2, '0')}</span>
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowUpRight size={18} className="text-white" />
            </div>
          </div>

          <div>
            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2 font-display translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{name}</h3>
            <p className="text-xs text-white/70 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{count} Products</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
