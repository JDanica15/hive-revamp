"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { DURATION, EASE, SPRING_SOFT } from "@/lib/motion";
import { SERVICES } from "@/lib/site";

const num = (i: number) => String(i + 1).padStart(2, "0");

export function Services() {
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState(0);
  const current = SERVICES[active];

  return (
    <section
      id="services"
      className="py-24 lg:py-32 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto"
      aria-labelledby="services-heading"
    >
      <div className="grid lg:grid-cols-12 gap-12 mb-16">
        <div className="lg:col-span-5">
          <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">What We Do</p>
          <h2 id="services-heading" className="font-heading text-4xl lg:text-5xl font-medium text-balance leading-tight">
            A modular ecosystem of expertise
          </h2>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 flex items-end">
          <p className="text-lg text-muted-foreground leading-relaxed">
            We don&apos;t sell hours — we deliver outcomes. Each service is a distinct capability that can be deployed
            independently or orchestrated together as a complete operational layer for your business.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-x-12 gap-y-8">
        {/* The list. A single accent indicator tracks the active row, so attention moves rather
            than six cards competing at once. */}
        <ul className="lg:col-span-7 relative border-t border-border">
          {/* Moving indicator: height of one row, translated down one row per active index. */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 w-px bg-accent"
            style={{ height: `${100 / SERVICES.length}%` }}
            animate={{ y: `${active * 100}%` }}
            transition={reduce ? { duration: 0 } : SPRING_SOFT}
          />
          {SERVICES.map((service, i) => {
            const isActive = i === active;
            return (
              <li key={service.title} className="border-b border-border">
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-expanded={isActive}
                  data-cursor="Explore"
                  className="group w-full text-left flex items-baseline gap-5 h-16 md:h-20 px-1 focus:outline-none"
                >
                  <span
                    className={
                      "font-mono text-xs tabular-nums transition-colors duration-300 " +
                      (isActive ? "text-accent" : "text-muted-foreground/60")
                    }
                  >
                    {num(i)}
                  </span>
                  <motion.span
                    className={
                      "font-heading text-2xl md:text-3xl font-medium transition-colors duration-300 " +
                      (isActive ? "text-foreground" : "text-muted-foreground/70 group-hover:text-foreground")
                    }
                    animate={{ x: isActive && !reduce ? 10 : 0 }}
                    transition={{ duration: DURATION.ui, ease: EASE.out }}
                  >
                    {service.title}
                  </motion.span>
                </button>
                {/* Inline description for mobile (no hover there) — reveals under the active row. */}
                <div className="lg:hidden overflow-hidden">
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: DURATION.ui, ease: EASE.out }}
                        className="text-muted-foreground leading-relaxed text-[15px] pb-6 pl-9 pr-2"
                      >
                        {service.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Desktop detail panel: a large ghost number and the active description, crossfading. */}
        <div className="hidden lg:block lg:col-span-5">
          <div className="sticky top-28">
            <div className="relative min-h-[16rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: DURATION.ui, ease: EASE.out }}
                >
                  <span className="font-heading text-[7rem] leading-none text-accent/15 select-none">{num(active)}</span>
                  <h3 className="font-heading text-3xl font-medium mt-4 mb-4">{current.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg max-w-md">{current.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
