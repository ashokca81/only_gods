'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  return (
    <section className="py-20 lg:py-32 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
            Stay Connected
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 font-display">
            Join the Gods
          </h2>
          <p className="text-sm text-muted-foreground mb-10 max-w-md mx-auto">
            Be the first to know about new drops, exclusive offers, and behind-the-scenes content.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
            />
            <button className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-foreground text-background text-xs tracking-[0.15em] uppercase font-semibold rounded-xl hover:bg-foreground/90 transition-colors">
              Subscribe
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;
