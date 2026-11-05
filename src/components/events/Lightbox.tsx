"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "@/components/icons";
import { SmartImage } from "@/components/SmartImage";
import { imageSize } from "@/lib/images";

type LightboxProps = { photos: string[]; initialIndex: number; title: string; onClose: () => void };

export function Lightbox({ photos, initialIndex, title, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const next = useCallback(
    (e?: MouseEvent) => {
      e?.stopPropagation();
      setIndex((i) => (i + 1) % photos.length);
    },
    [photos.length],
  );
  const prev = useCallback(
    (e?: MouseEvent) => {
      e?.stopPropagation();
      setIndex((i) => (i - 1 + photos.length) % photos.length);
    },
    [photos.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, photos.length]);

  const [width, height] = imageSize(photos[index]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photo gallery`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-foreground/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX === null) return;
        const delta = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(delta) > 50) {
          if (delta > 0) next();
          else prev();
        }
        setTouchStartX(null);
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 z-10 w-11 h-11 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
        aria-label="Close gallery"
      >
        <X className="w-5 h-5 text-background" />
      </button>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 sm:left-6 z-10 w-11 h-11 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 h-5 text-background" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 sm:right-6 z-10 w-11 h-11 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 h-5 text-background" />
          </button>
        </>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[88vw] max-h-[82vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <SmartImage
            src={photos[index]}
            alt={`${title} — photo ${index + 1}`}
            width={width}
            height={height}
            sizes="88vw"
            className="max-w-[88vw] max-h-[82vh] object-contain rounded-sm"
          />
        </motion.div>
      </AnimatePresence>
      {photos.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 text-center text-background/50 text-sm tabular-nums" aria-live="polite">
          {index + 1} <span className="text-background/30">/ {photos.length}</span>
        </div>
      )}
    </motion.div>
  );
}
