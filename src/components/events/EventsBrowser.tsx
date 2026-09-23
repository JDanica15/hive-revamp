"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Camera, CalendarDays, MapPin } from "@/components/icons";
import { SmartImage } from "@/components/SmartImage";
import type { HiveEvent } from "@/lib/data";
import { formatShortDate } from "@/lib/format";

const CATEGORIES = ["All", "Party", "Dinner", "Company Gathering", "Celebration", "Activity"];

function EventCard({ event, index }: { event: HiveEvent; index: number }) {
  const photoCount = event.photos ? event.photos.length : 0;
  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
    >
      <Link href={`/events/${event.id}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-muted">
          <SmartImage
            src={event.cover_photo_url}
            alt={event.title}
            fill
            sizes="(min-width: 1280px) 380px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            priority={index < 3}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="inline-block px-3 py-1.5 bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium tracking-wide rounded-full">
              {event.category}
            </span>
          </div>
          {photoCount > 0 && (
            <div className="absolute top-4 right-4">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground/40 backdrop-blur-sm text-background text-xs font-medium rounded-full"
                aria-label={`${photoCount} photos`}
              >
                <Camera className="w-3 h-3" />
                {photoCount}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-background/70 text-xs tracking-[0.15em] uppercase mb-2">
              <time dateTime={event.date}>{formatShortDate(event.date)}</time>
            </p>
            <h2 className="font-heading text-2xl text-background font-medium leading-tight">{event.title}</h2>
            {event.location && (
              <p className="flex items-center gap-1.5 text-background/60 text-sm mt-2">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </p>
            )}
          </div>
          <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight className="w-4 h-4 text-foreground" />
          </div>
        </div>
        <p className="mt-4 text-muted-foreground text-[15px] leading-relaxed line-clamp-2">{event.description}</p>
      </Link>
    </motion.li>
  );
}

export function EventsBrowser({ events }: { events: HiveEvent[] }) {
  const [category, setCategory] = useState("All");
  const visible = category === "All" ? events : events.filter((e) => e.category === category);

  return (
    <>
      <section className="px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto pb-8">
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={
                "px-4 py-2 rounded-full text-sm font-medium transition-colors " +
                (category === c ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </section>
      <section className="px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto pb-24 lg:pb-32" aria-label="Events">
        {visible.length === 0 ? (
          <div className="text-center py-24">
            <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No events to show in this category yet.</p>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {visible.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
