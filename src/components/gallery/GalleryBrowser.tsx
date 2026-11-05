"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { Lightbox } from "@/components/events/Lightbox";
import { Camera } from "@/components/icons";
import { SmartImage } from "@/components/SmartImage";
import type { Album } from "@/lib/gallery";
import { imageSize } from "@/lib/images";

function AlbumSection({ album, onOpen }: { album: Album; onOpen: (index: number) => void }) {
  return (
    <section id={album.id} className="scroll-mt-28 mb-20 lg:mb-28 last:mb-0" aria-labelledby={`${album.id}-heading`}>
      <div className="grid lg:grid-cols-12 gap-4 lg:gap-6 mb-8 pb-6 border-b border-border">
        <div className="lg:col-span-7">
          <p className="flex items-center gap-3 text-muted-foreground text-xs tracking-[0.15em] uppercase mb-3">
            {album.when && <span>{album.when}</span>}
            {album.when && <span className="w-1 h-1 rounded-full bg-muted-foreground/40" aria-hidden="true" />}
            <span className="inline-flex items-center gap-1.5">
              <Camera className="w-3 h-3" />
              {album.photos.length} photos
            </span>
          </p>
          <h2 id={`${album.id}-heading`} className="font-heading text-3xl lg:text-4xl font-medium leading-tight">
            {album.title}
          </h2>
        </div>
        <p className="lg:col-span-5 flex items-end text-muted-foreground leading-relaxed">{album.description}</p>
      </div>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 lg:gap-6">
        {album.photos.map((src, i) => {
          const [width, height] = imageSize(src);
          return (
            <motion.button
              key={src}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              onClick={() => onOpen(i)}
              aria-label={`Open photo ${i + 1} of ${album.photos.length} from ${album.title}`}
              className="group block w-full mb-4 lg:mb-6 break-inside-avoid relative overflow-hidden rounded-sm cursor-zoom-in"
            >
              <SmartImage
                src={src}
                alt={`${album.title} — photo ${i + 1}`}
                width={width}
                height={height}
                sizes="(min-width: 1280px) 400px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                className="w-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

export function GalleryBrowser({ albums }: { albums: Album[] }) {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<{ album: Album; index: number } | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const visible = filter === "all" ? albums : albums.filter((a) => a.id === filter);
  const total = albums.reduce((sum, a) => sum + a.photos.length, 0);

  const pill = (id: string, label: string, count: number) => (
    <button
      key={id}
      type="button"
      onClick={() => setFilter(id)}
      aria-pressed={filter === id}
      className={
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors " +
        (filter === id ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70")
      }
    >
      {label}
      <span className={"text-xs tabular-nums " + (filter === id ? "text-background/60" : "text-muted-foreground/60")}>
        {count}
      </span>
    </button>
  );

  return (
    <>
      <section className="px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto pb-12">
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter by album">
          {pill("all", "All", total)}
          {albums.map((a) => pill(a.id, a.title, a.photos.length))}
        </div>
      </section>
      <div className="px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto pb-24 lg:pb-32">
        {visible.map((album) => (
          <AlbumSection key={album.id} album={album} onOpen={(index) => setOpen({ album, index })} />
        ))}
      </div>
      {open && <Lightbox photos={open.album.photos} initialIndex={open.index} title={open.album.title} onClose={close} />}
    </>
  );
}
