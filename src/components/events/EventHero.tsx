"use client";

import { motion } from "framer-motion";
import { Calendar, Camera, MapPin } from "@/components/icons";
import { SmartImage } from "@/components/SmartImage";
import type { HiveEvent } from "@/lib/data";
import { formatLongDate } from "@/lib/format";

export function EventHero({ event }: { event: HiveEvent }) {
  const photoCount = event.photos?.length ?? 0;
  return (
    <>
      <section className="px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto pt-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative aspect-[16/9] lg:aspect-[21/9] rounded-sm overflow-hidden"
        >
          <SmartImage
            src={event.cover_photo_url}
            alt={event.title}
            fill
            priority
            sizes="(min-width: 1280px) 1088px, 100vw"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-12">
            {event.category && (
              <span className="inline-block px-3 py-1.5 bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium tracking-wide rounded-full mb-4">
                {event.category}
              </span>
            )}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-background font-medium leading-tight">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-background/70">
              {event.date && (
                <span className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={event.date}>{formatLongDate(event.date)}</time>
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </span>
              )}
              {photoCount > 0 && (
                <span className="flex items-center gap-2 text-sm">
                  <Camera className="w-4 h-4" />
                  {photoCount} photos
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </section>
      {event.description && (
        <section className="px-6 sm:px-12 lg:px-24 max-w-3xl mx-auto pb-12">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground leading-relaxed"
          >
            {event.description}
          </motion.p>
        </section>
      )}
    </>
  );
}
