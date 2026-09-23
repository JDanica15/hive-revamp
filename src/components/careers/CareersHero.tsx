"use client";

import { motion } from "framer-motion";
import { AppLink } from "@/components/AppLink";
import { ArrowUpRight } from "@/components/icons";
import { SmartImage } from "@/components/SmartImage";

export function CareersHero() {
  return (
    <section className="relative pt-32 pb-20 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto overflow-hidden">
      <div className="grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">Career Architecture</p>
            <h1 className="font-heading text-5xl lg:text-6xl xl:text-7xl font-medium text-balance leading-[0.95]">
              Build a career, not just a job
            </h1>
            <p className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed">
              We treat BPO work as a prestigious career path. Continuous training, clear advancement, and a culture that
              invests in people — that&apos;s the Hive difference.
            </p>
            <AppLink
              href="/#testimonials"
              className="group inline-flex items-center gap-2 mt-8 text-accent font-medium hover:underline"
            >
              Hear from our people
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </AppLink>
          </motion.div>
        </div>
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative aspect-[4/5] rounded-sm overflow-hidden"
          >
            <SmartImage
              src="/media/photo-1521737711867-e3b97375f902-1bhlj8x.jpg"
              alt="Collaborative team at work"
              fill
              priority
              sizes="(min-width: 1280px) 430px, (min-width: 1024px) 38vw, 100vw"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
