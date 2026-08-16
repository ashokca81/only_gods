'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative w-full h-[calc(100svh-4rem)] lg:h-screen overflow-hidden bg-black flex items-center justify-center">

      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        {/* Mobile Video (9:16) */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="https://images.pexels.com/videos/7710243/free-video-7710243.jpg?auto=compress&cs=tinysrgb&fit=crop&h=1920&w=1080"
          className="md:hidden w-full h-full object-cover opacity-60 scale-105"
        >
          <source src="https://videos.pexels.com/video-files/6615627/6615627-uhd_1440_2732_25fps.mp4" type="video/mp4" />
          <img
            src="https://images.pexels.com/videos/7710243/free-video-7710243.jpg?auto=compress&cs=tinysrgb&fit=crop&h=1920&w=1080"
            alt="Hero Background Mobile"
            className="w-full h-full object-cover"
          />
        </video>

        {/* Desktop Video (16:9) */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="https://images.unsplash.com/photo-1523396896303-1e8ee5006752?q=80&w=2940&auto=format&fit=crop"
          className="hidden md:block w-full h-full object-cover opacity-60 scale-105"
        >
          <source src="https://videos.pexels.com/video-files/10330518/10330518-uhd_2560_1440_25fps.mp4" type="video/mp4" />
          <img
            src="https://images.unsplash.com/photo-1523396896303-1e8ee5006752?q=80&w=2940&auto=format&fit=crop"
            alt="Hero Background Desktop"
            className="w-full h-full object-cover"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full container mx-auto px-4 flex flex-col items-center justify-center text-center pt-20">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <h1 className="whitespace-nowrap text-[10.4vw] sm:text-[9.4vw] md:text-[10.4vw] lg:text-[11.3vw] leading-[0.85] font-black text-white mix-blend-overlay tracking-[0.1em] md:tracking-[0.15em] font-display uppercase">
            Only Gods
          </h1>
        </motion.div>

      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="absolute bottom-0 left-0 w-full flex justify-center z-20"
      >
        <Link
          href="/shop"
          className="inline-block group text-white px-8 py-4 text-sm md:text-base font-black uppercase tracking-[0.25em] hover:text-white/70 transition-all duration-300 hover:scale-105 drop-shadow-xl"
        >
          Shop Now
        </Link>
      </motion.div>



    </section>
  );
};

export default Hero;
