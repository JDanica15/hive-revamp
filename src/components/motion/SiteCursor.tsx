"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

// A minimal custom cursor (§12): a small dot that grows over interactive elements and shows a
// short verb (View / Play / Explore) when an element declares one via `data-cursor`.
// Desktop fine-pointer only — never on touch, never under reduced motion, so the native cursor
// stays for anyone who needs it. Uses mix-blend-difference so the dot is visible on dark and light.
export function SiteCursor() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<{ active: boolean; label?: string }>({ active: false });

  const x = useSpring(useMotionValue(-100), { stiffness: 500, damping: 40, mass: 0.3 });
  const y = useSpring(useMotionValue(-100), { stiffness: 500, damping: 40, mass: 0.3 });

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    setEnabled(true);
    document.body.style.cursor = "none";

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(
        'a, button, [role="button"], input, textarea, select, label, [data-cursor]',
      );
      setState(el ? { active: true, label: el.dataset.cursor } : { active: false });
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
    };
  }, [reduce, x, y]);

  if (!enabled) return null;
  const hasLabel = state.active && !!state.label;
  const size = hasLabel ? 64 : state.active ? 40 : 10;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
      style={{ x, y }}
    >
      <motion.div
        className="flex items-center justify-center rounded-full bg-white text-black text-[10px] font-medium uppercase tracking-wider"
        animate={{ width: size, height: size }}
        transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.4 }}
      >
        {hasLabel ? state.label : null}
      </motion.div>
    </motion.div>
  );
}
