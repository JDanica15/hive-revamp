"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Lightbox } from "@/components/events/Lightbox";
import { ArrowUpRight, ChevronLeft, ChevronRight, Play } from "@/components/icons";
import { SmartImage } from "@/components/SmartImage";
import { VideoModal } from "@/components/VideoModal";
import { DURATION, EASE } from "@/lib/motion";
import { MOMENTS, VIDEO_STORIES, type VideoStory } from "@/lib/stories";

export function VideoStories() {
  const [playing, setPlaying] = useState<VideoStory | null>(null);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const closeVideo = useCallback(() => setPlaying(null), []);
  const closePhoto = useCallback(() => setPhotoIndex(null), []);

  // Cinematic entrance: as the strip rises into view it expands from slightly small and its
  // framing radius tightens, like a film settling into frame — one moment, not seven fades.
  const { scrollYProgress } = useScroll({ target: stripRef, offset: ["start 0.9", "start 0.45"] });
  const stripScale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const stripRadius = useTransform(scrollYProgress, [0, 1], [28, 4]);

  const scrollRow = (dir: 1 | -1) => {
    const row = rowRef.current;
    if (row) row.scrollBy({ left: dir * row.clientWidth * 0.8, behavior: "smooth" });
  };

  // Mouse drag-to-scroll. Touch already scrolls natively, so only mouse pointers are handled here.
  // Snapping is paused while dragging, then the row settles on the nearest card.
  const drag = useRef({ active: false, moved: false, startX: 0, startLeft: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startLeft: e.currentTarget.scrollLeft };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const row = e.currentTarget;
    const dx = e.clientX - d.startX;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      d.moved = true;
      row.setPointerCapture(e.pointerId);
      row.style.scrollSnapType = "none";
      row.style.scrollBehavior = "auto";
      row.style.cursor = "grabbing";
    }
    row.scrollLeft = d.startLeft - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (!d.moved) return;
    const row = e.currentTarget;
    const cards = Array.from(row.children) as HTMLElement[];
    const origin = cards[0]?.offsetLeft ?? 0;
    const nearest = cards.reduce(
      (best, card) => {
        const left = card.offsetLeft - origin;
        return Math.abs(left - row.scrollLeft) < Math.abs(best - row.scrollLeft) ? left : best;
      },
      0,
    );
    row.style.cursor = "";
    row.style.scrollBehavior = "";
    row.scrollTo({ left: nearest, behavior: reduce ? "auto" : "smooth" });
    // Restore snapping once the settle animation has finished, so it doesn't fight it.
    window.setTimeout(() => (row.style.scrollSnapType = ""), reduce ? 0 : 400);
  };

  // A drag ends with a click on whichever card is under the mouse; swallow it so it doesn't open a video.
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
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
      <div ref={stripRef} className="relative mb-16">
        <motion.div
          style={reduce ? undefined : { scale: stripScale, borderRadius: stripRadius }}
          className="overflow-hidden"
        >
          <div
            ref={rowRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={onClickCapture}
            onDragStart={(e) => e.preventDefault()}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth overscroll-x-contain pb-2 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {VIDEO_STORIES.map((story) => (
              <div
                key={story.video}
                className="snap-start shrink-0 w-[70%] sm:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)]"
              >
                <button
                  type="button"
                  onClick={() => setPlaying(story)}
                  aria-label={`Play ${story.name}'s video story`}
                  data-cursor="Play"
                  className="relative block aspect-[3/4] w-full rounded-sm overflow-hidden bg-muted group cursor-pointer text-left"
                >
                  <SmartImage
                    src={story.poster}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 70vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <Play className="w-5 h-5 text-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-foreground/90 to-transparent">
                    <p className="text-background font-medium text-sm">{story.name}</p>
                    {story.role && <p className="text-background/70 text-xs">{story.role}</p>}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </motion.div>
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
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: DURATION.editorial, ease: EASE.out }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {MOMENTS.map((moment, i) => (
          <button
            key={moment.src}
            type="button"
            onClick={() => setPhotoIndex(i)}
            aria-label={`View photo: ${moment.caption}`}
            data-cursor="View"
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
        ))}
      </motion.div>
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
