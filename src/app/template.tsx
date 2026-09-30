"use client";

import { motion, useReducedMotion } from "framer-motion";

// Wraps every page and remounts on navigation, so routes fade in gently instead of snapping (§11).
// Opacity only — deliberately no transform, because a transform on a page-root element would
// become the containing block for the site's `fixed` header and break it. The fade never delays
// navigation: Next fetches the route, then this plays on mount.
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
