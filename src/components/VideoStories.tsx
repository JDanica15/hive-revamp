"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Lightbox } from "@/components/events/Lightbox";
import { ArrowUpRight, ChevronLeft, ChevronRight, Play } from "@/components/icons";
import { SmartImage } from "@/components/SmartImage";
import { VideoModal } from "@/components/VideoModal";
import { FEATURED_STORY, MOMENTS, VIDEO_STORIES, type VideoStory } from "@/lib/stories";

export function VideoStories() {
  const [playing, setPlaying] = useState<VideoStory | null>(null);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const closeVideo = useCallback(() => setPlaying(null), []);
  const closePhoto = useCallback(() => setPhotoIndex(null), []);

  const scrollRow = (dir: 1 | -1) => {
    const row = rowRef.current;
    if (row) row.scrollBy({ left: dir * row.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section
      className="py-24 lg:py-32 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto"
      aria-labelledby="video-stories-heading"
    >
      <div className="mb-12">
        <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">Video Stories</p>
        <h2
          id="video-stories-heading"
          className="font-heading text-4xl lg:text-5xl font-medium text-balance leading-tight max-w-2xl"
        >
          Hear directly from our people
        </h2>
        <p className="mt-5 text-muted-foreground text-lg max-w-2xl leading-relaxed">
          Real voices, real experiences. Short video stories from the team members who make Hive, Hive.
        </p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <button
          type="button"
          onClick={() => setPlaying(FEATURED_STORY)}
          aria-label={`Play ${FEATURED_STORY.name}'s video story`}
          className="relative block aspect-video w-full rounded-sm overflow-hidden bg-foreground group cursor-pointer text-left"
        >
          <SmartImage
            src={FEATURED_STORY.poster}
            alt=""
            fill
            sizes="(min-width: 1280px) 1184px, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-foreground/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-background/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Play className="w-7 h-7 text-foreground ml-1" fill="currentColor" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-foreground/90 to-transparent">
            <p className="text-background font-heading text-xl font-semibold">{FEATURED_STORY.name}</p>
            {FEATURED_STORY.role && <p className="text-background/70 text-sm">{FEATURED_STORY.role}</p>}
          </div>
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-background/20 backdrop-blur-sm text-background text-xs tracking-wider uppercase">
            Featured
          </div>
        </button>
      </motion.div>
      <div className="relative mb-16">
        <div
          ref={rowRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {VIDEO_STORIES.map((story, i) => (
            <motion.div
              key={story.video}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: Math.min(i, 3) * 0.1 }}
              className="snap-start shrink-0 w-[70%] sm:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)]"
            >
              <button
                type="button"
                onClick={() => setPlaying(story)}
                aria-label={`Play ${story.name}'s video story`}
                className="relative block aspect-[3/4] w-full rounded-sm overflow-hidden bg-muted group cursor-pointer text-left"
              >
                <SmartImage
                  src={story.poster}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 70vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-5 h-5 text-foreground ml-0.5" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-foreground/90 to-transparent">
                  <p className="text-background font-medium text-sm">{story.name}</p>
                  {story.role && <p className="text-background/70 text-xs">{story.role}</p>}
                </div>
              </button>
            </motion.div>
          ))}
        </div>
        <div className="hidden sm:flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => scrollRow(-1)}
            aria-label="Previous stories"
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollRow(1)}
            aria-label="More stories"
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Moments at Hive</p>
        <Link
          href="/gallery"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent transition-colors"
        >
          View gallery
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOMENTS.map((moment, i) => (
          <motion.div
            key={moment.src}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
          >
            <button
              type="button"
              onClick={() => setPhotoIndex(i)}
              aria-label={`View photo: ${moment.caption}`}
              className="relative block aspect-[4/5] w-full rounded-sm overflow-hidden bg-muted group cursor-zoom-in text-left"
            >
              <SmartImage
                src={moment.src}
                alt={moment.caption}
                fill
                sizes="(min-width: 1024px) 280px, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-foreground/80 to-transparent">
                <p className="text-background/80 text-xs">{moment.caption}</p>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {playing && <VideoModal key={playing.video} story={playing} onClose={closeVideo} />}
      </AnimatePresence>
      <AnimatePresence>
        {photoIndex !== null && (
          <Lightbox
            photos={MOMENTS.map((m) => m.src)}
            initialIndex={photoIndex}
            title="Moments at Hive"
            onClose={closePhoto}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
