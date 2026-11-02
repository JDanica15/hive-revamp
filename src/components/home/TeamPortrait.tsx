"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "@/components/icons";
import { DURATION, EASE } from "@/lib/motion";

export type Portrait = { url: string; name: string; role?: string; focus?: string; center?: boolean };

/**
 * Full-bleed view of a team member's photo, opened by clicking their hex in the comb.
 * The hex crop is dropped here: the poster frames are shot 9:16, so the portrait is shown
 * upright and as tall as the viewport allows. Arrow keys walk the comb; Escape closes.
 */
export function TeamPortrait({
  portrait,
  onClose,
  onPrev,
  onNext,
}: {
  portrait: Portrait;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={portrait.role ? `${portrait.name}, ${portrait.role}` : portrait.name}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.micro, ease: EASE.out }}
      className="fixed inset-0 z-[100] bg-foreground/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 z-10 w-11 h-11 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
        aria-label="Close portrait"
      >
        <X className="w-5 h-5 text-background" />
      </button>

      {/* Step through the comb without closing — the photos read as one set. */}
      {[
        { dir: "prev", action: onPrev, Icon: ChevronLeft, side: "left-4 sm:left-8", label: "Previous person" },
        { dir: "next", action: onNext, Icon: ChevronRight, side: "right-4 sm:right-8", label: "Next person" },
      ].map(({ dir, action, Icon, side, label }) => (
        <button
          key={dir}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            action();
          }}
          className={`absolute ${side} top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors`}
          aria-label={label}
        >
          <Icon className="w-5 h-5 text-background" />
        </button>
      ))}

      <motion.figure
        key={portrait.url}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.ui, ease: EASE.cinematic }}
        className="flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- poster frames, sized by the viewport */}
        <img
          src={portrait.url}
          alt={portrait.name}
          className="max-h-[78vh] max-w-[88vw] w-auto h-auto rounded-sm bg-foreground object-contain"
        />
        <figcaption className="mt-4 text-center">
          <span className="block text-background font-heading text-lg font-semibold">{portrait.name}</span>
          {portrait.role && <span className="block text-background/60 text-sm">{portrait.role}</span>}
        </figcaption>
      </motion.figure>
    </motion.div>
  );
}
