"use client";

import { motion } from "framer-motion";
import { AppLink } from "@/components/AppLink";
import { ArrowDown, ArrowUpRight, Briefcase } from "@/components/icons";
import { SmartImage } from "@/components/SmartImage";

type Stats = { openRoles: number; teams: number; types: string[] };

export function CareersHero({ stats }: { stats: Stats }) {
  const items = [
    { value: String(stats.openRoles), label: stats.openRoles === 1 ? "Open role" : "Open roles" },
    { value: String(stats.teams), label: "Teams hiring" },
    { value: "Remote", label: "& Sydney, AU" },
    { value: stats.types.length > 1 ? "Flexible" : stats.types[0] ?? "Full-time", label: stats.types.join(" · ") },
  ];

  return (
    <section className="relative pt-32 pb-16 lg:pb-20 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto overflow-hidden">
      <div className="grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">Careers at Hive</p>
            <h1 className="font-heading text-5xl lg:text-6xl xl:text-7xl font-medium text-balance leading-[0.95]">
              Build a career, not just a job
            </h1>
            <p className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed">
              We treat BPO work as a prestigious career path. Continuous training, clear advancement, and a culture that
              invests in people — that&apos;s the Hive difference.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
              <AppLink
                href="/careers#open-roles"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-foreground text-background rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                View open roles
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </AppLink>
              <AppLink
                href="/#testimonials"
                className="group inline-flex items-center gap-2 text-accent text-sm font-medium hover:underline"
              >
                Hear from our people
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </AppLink>
            </div>
          </motion.div>
        </div>
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-sm overflow-hidden">
              <SmartImage
                src="/media/photo-1521737711867-e3b97375f902-1bhlj8x.jpg"
                alt="Hive team members collaborating in the office"
                fill
                priority
                sizes="(min-width: 1280px) 430px, (min-width: 1024px) 38vw, 100vw"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 left-6 right-6 sm:right-auto sm:-left-8 flex items-center gap-4 px-5 py-4 bg-background border border-border rounded-sm shadow-xl">
              <span className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-accent" />
              </span>
              <div>
                <p className="font-heading text-lg font-medium leading-tight">We&apos;re hiring</p>
                <p className="text-sm text-muted-foreground">
                  {stats.openRoles} open {stats.openRoles === 1 ? "role" : "roles"} across {stats.teams} teams
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.dl
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-sm overflow-hidden"
      >
        {items.map((item) => (
          <div key={item.label} className="bg-background px-6 py-6 lg:px-8">
            <dt className="sr-only">{item.label}</dt>
            <dd>
              <p className="font-heading text-3xl lg:text-4xl font-medium text-accent">{item.value}</p>
              <p className="text-xs tracking-wider uppercase text-muted-foreground mt-2">{item.label}</p>
            </dd>
          </div>
        ))}
      </motion.dl>
    </section>
  );
}
