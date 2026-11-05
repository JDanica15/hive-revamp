"use client";

import { motion } from "framer-motion";

export function GalleryIntro() {
  return (
    <section className="relative pt-32 pb-16 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">Gallery</p>
        <h1 className="font-heading text-5xl lg:text-6xl xl:text-7xl font-medium text-balance leading-[0.95]">
          The faces
          <br />
          behind Hive
        </h1>
        <p className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed">
          Team nights, client visits and everyday moments — a look at the people and the places that make up life at
          Hive.
        </p>
      </motion.div>
    </section>
  );
}
