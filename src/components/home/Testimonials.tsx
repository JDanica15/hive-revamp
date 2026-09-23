"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { SmartImage } from "@/components/SmartImage";
import type { Testimonial } from "@/lib/data";

type Tab = "employee" | "client";

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [tab, setTab] = useState<Tab>("employee");
  const [selected, setSelected] = useState(0);

  const employees = testimonials.filter((t) => (t.testimonial_type || "employee") === "employee");
  const clients = testimonials.filter((t) => t.testimonial_type === "client");
  const hasClients = clients.length > 0;
  const list = tab === "employee" ? employees : clients;
  if (!list.length) return null;

  const active = list[Math.min(selected, list.length - 1)] || list[0];
  const switchTab = (next: Tab) => {
    setTab(next);
    setSelected(0);
  };

  return (
    <section
      id="testimonials"
      className="py-24 lg:py-32 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto"
      aria-labelledby="testimonials-heading"
    >
      <div className="mb-12">
        <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">Living Proof</p>
        <h2
          id="testimonials-heading"
          className="font-heading text-4xl lg:text-5xl font-medium text-balance leading-tight max-w-2xl mb-8"
        >
          The people behind the work
        </h2>
        {hasClients && (
          <div className="inline-flex gap-1 p-1 bg-muted rounded-full" role="tablist" aria-label="Testimonials">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "employee"}
              onClick={() => switchTab("employee")}
              className={
                "px-5 py-2 rounded-full text-sm font-medium transition-colors " +
                (tab === "employee" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
              }
            >
              Our People
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "client"}
              onClick={() => switchTab("client")}
              className={
                "px-5 py-2 rounded-full text-sm font-medium transition-colors " +
                (tab === "client" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
              }
            >
              Client Voices
            </button>
          </div>
        )}
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
                <p className="text-background/70 text-xs">{tab === "employee" ? t.role : t.client_title || t.role}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="lg:col-span-7 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.figure
              key={`${active.id}-${tab}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-accent font-heading text-6xl leading-none mb-6" aria-hidden="true">
                &quot;
              </div>
              <blockquote className="font-heading text-2xl lg:text-3xl font-medium leading-snug text-balance">
                {active.quote}
              </blockquote>
              <figcaption className="mt-10 pt-8 border-t border-border flex items-center justify-between">
                <div>
                  <p className="font-heading text-lg font-semibold">{active.employee_name}</p>
                  {tab === "employee" ? (
                    <p className="text-muted-foreground text-sm">
                      {active.role} · {active.department}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {active.client_title} · {active.client_company}
                    </p>
                  )}
                </div>
                {tab === "employee" ? (
                  <div className="text-right">
                    <p className="font-heading text-3xl font-semibold text-accent">{active.years_at_company}</p>
                    <p className="text-xs text-muted-foreground tracking-wider uppercase">Years at Hive</p>
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="font-heading text-lg font-semibold text-accent">{active.client_company}</p>
                    <p className="text-xs text-muted-foreground tracking-wider uppercase">Partner</p>
                  </div>
                )}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
