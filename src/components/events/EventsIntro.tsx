"use client";

import { motion } from "framer-motion";

export function EventsIntro() {
  return (
    <section className="relative pt-32 pb-16 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">Life at Hive</p>
        <h1 className="font-heading text-5xl lg:text-6xl xl:text-7xl font-medium text-balance leading-[0.95]">
          Moments worth
          <br />
          remembering
        </h1>
        <p className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed">
          From gala dinners to team retreats, holiday celebrations to client nights — these are the gatherings that shape
          our culture and bring our people together.
        </p>
      </motion.div>
    </section>
  );
}
