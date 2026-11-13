"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { SmartImage } from "@/components/SmartImage";
import type { Testimonial } from "@/lib/data";
import { DURATION, EASE } from "@/lib/motion";

// Client testimonials only. (Employee entries in testimonials.json are not shown on the site.)
export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState(0);

  const list = testimonials.filter((t) => t.testimonial_type === "client");
  if (!list.length) return null;

  const active = list[Math.min(selected, list.length - 1)] || list[0];

  return (
    <section
      id="testimonials"
      className="py-24 lg:py-32 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto"
      aria-labelledby="testimonials-heading"
    >
      <div className="mb-12">
        <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">Client Voices</p>
        <h2
          id="testimonials-heading"
          className="font-heading text-4xl lg:text-5xl font-medium text-balance leading-tight max-w-2xl"
        >
          What our clients say
        </h2>
      </div>
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {list.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
              aria-label={`Read ${t.employee_name}'s story`}
              className={
                "group relative aspect-[3/4] overflow-hidden rounded-sm transition-all duration-300 " +
                (selected === i ? "ring-2 ring-accent ring-offset-4 ring-offset-background" : "opacity-70 hover:opacity-100")
              }
            >
              <SmartImage
                src={t.photo_url}
                alt={t.employee_name}
                fill
                sizes="(min-width: 1024px) 20vw, 50vw"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <p className="text-background font-medium text-sm">{t.employee_name}</p>
                {(t.client_title || t.role) && (
                  <p className="text-background/70 text-xs">{t.client_title || t.role}</p>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="lg:col-span-7 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.figure
              key={active.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.editorial, ease: EASE.inOut }}
            >
              {active.quote && (
                <>
                  <div className="text-accent font-heading text-6xl leading-none mb-6" aria-hidden="true">
                    &quot;
                  </div>
                  <blockquote
                    className={
                      "font-heading font-medium whitespace-pre-line " +
                      (active.quote.length > 280
                        ? "text-lg lg:text-xl leading-relaxed"
                        : "text-2xl lg:text-3xl leading-snug text-balance")
                    }
                  >
                    {active.quote}
                  </blockquote>
                </>
              )}
              <figcaption
                className={
                  "flex items-center justify-between " + (active.quote ? "mt-10 pt-8 border-t border-border" : "")
                }
              >
                <div>
                  <p className="font-heading font-semibold text-lg">{active.employee_name}</p>
                  <p className="text-muted-foreground text-sm">
                    {[active.client_title, active.client_company].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-lg font-semibold text-accent">{active.client_company}</p>
                  <p className="text-xs text-muted-foreground tracking-wider uppercase">Partner</p>
                </div>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
