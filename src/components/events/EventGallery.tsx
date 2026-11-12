"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { Lightbox } from "@/components/events/Lightbox";
import { SmartImage } from "@/components/SmartImage";
import { imageSize } from "@/lib/images";

export function EventGallery({ photos, title }: { photos: string[]; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const close = useCallback(() => setOpenIndex(null), []);

  return (
    <>
      <section className="px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto pb-24 lg:pb-32" aria-labelledby="gallery-heading">
        <h2 id="gallery-heading" className="font-heading text-2xl font-medium mb-8">
          Gallery
        </h2>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 lg:gap-6">
          {photos.map((src, i) => {
            const [width, height] = imageSize(src);
            return (
              <motion.button
                key={i}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
                onClick={() => setOpenIndex(i)}
                aria-label={`Open photo ${i + 1} of ${photos.length}`}
                className="group block w-full mb-4 lg:mb-6 break-inside-avoid relative overflow-hidden rounded-sm"
              >
                <SmartImage
                  src={src}
                  alt={`${title} — photo ${i + 1}`}
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
      {openIndex !== null && photos.length > 0 && (
        <Lightbox photos={photos} initialIndex={openIndex} title={title} onClose={close} />
      )}
    </>
  );
}
