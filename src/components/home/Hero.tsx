"use client";

import { motion } from "framer-motion";
import { AppLink } from "@/components/AppLink";
import { ArrowDown, ArrowUpRight } from "@/components/icons";
import { HERO_VIDEO } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden bg-foreground" aria-labelledby="hero-heading">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-foreground/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-transparent to-foreground/60" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-6"
        >
          Strategic Outsourcing, Human Intelligence
        </motion.p>
        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-heading text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-medium text-background text-balance leading-[0.95]"
        >
          Where people, talent
          <br />
          and technology connect
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-lg sm:text-xl text-background/80 max-w-2xl leading-relaxed"
        >
          We build dedicated teams that scale your business through human intelligence — HR, finance, customer service,
          and operations, orchestrated as one.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <AppLink
            href="/#contact"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-background text-foreground rounded-full text-sm font-medium hover:bg-background/90 transition-colors"
          >
            Get a Quote
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </AppLink>
          <AppLink
            href="/#testimonials"
            className="text-background/80 text-sm font-medium hover:text-background transition-colors underline underline-offset-4 decoration-background/30"
          >
            Meet our people
          </AppLink>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-background/50"
        >
          <span className="text-xs tracking-[0.2em] uppercase">Scroll</span>
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
