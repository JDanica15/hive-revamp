"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { SPRING } from "@/lib/motion";

type MagneticProps = {
  children: ReactNode;
  /** How far the element is pulled toward the cursor, in px. Keep small — this is a hint, not a jump. */
  strength?: number;
  className?: string;
};

/**
 * Pulls its child gently toward the cursor while hovered, then springs back — the physical
 * "this is interactive" cue from the brief (§10/§12). No-ops on touch devices and when the
 * visitor prefers reduced motion, so it never gets in the way.
 */
export function Magnetic({ children, strength = 14, className }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    // Normalise to the element's half-size so the pull is proportional, then cap at `strength`.
    x.set((relX / (rect.width / 2)) * strength);
    y.set((relY / (rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x, y, display: "inline-flex" }}
      className={className}
    >
      {children}
    </motion.span>
  );
}
