"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { X } from "@/components/icons";
import type { VideoStory } from "@/lib/stories";

export function VideoModal({ story, onClose }: { story: VideoStory; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${story.name}'s video story`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-foreground/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 z-10 w-11 h-11 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
        aria-label="Close video"
      >
        <X className="w-5 h-5 text-background" />
      </button>
      <motion.figure
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          src={story.video}
          poster={story.poster}
          controls
          autoPlay
          playsInline
          className="max-w-[92vw] max-h-[80vh] rounded-sm bg-foreground"
        />
        <figcaption className="mt-4 text-center">
          <span className="block text-background font-heading text-lg font-semibold">{story.name}</span>
          {story.role && <span className="block text-background/60 text-sm">{story.role}</span>}
        </figcaption>
      </motion.figure>
    </motion.div>
  );
}
