// Hive's motion system — one source of truth so timing and easing feel authored, not random.
// Durations follow a deliberate scale (§14 of the motion brief); nothing should invent its own.

export const DURATION = {
  micro: 0.2, // hover states, small UI feedback (150–250ms)
  ui: 0.4, // normal transitions (300–450ms)
  editorial: 0.65, // text/section reveals (500–800ms)
  cinematic: 1.0, // hero lines, video settle (800–1200ms)
  ambient: 1.6, // large, slow background movement (1200ms+)
} as const;

// Easing curves, chosen per role rather than one curve everywhere.
export const EASE = {
  // Calm, decisive settle — the house curve for UI and reveals.
  out: [0.22, 1, 0.36, 1] as const,
  // Slower, more cinematic settle for large image/video movement.
  cinematic: [0.16, 1, 0.3, 1] as const,
  // Symmetric in/out for crossfades.
  inOut: [0.65, 0, 0.35, 1] as const,
} as const;

// Spring for physical, magnetic interactions (cursor-follow, CTA pull).
export const SPRING = { type: "spring", stiffness: 150, damping: 15, mass: 0.1 } as const;
export const SPRING_SOFT = { type: "spring", stiffness: 90, damping: 18, mass: 0.4 } as const;

/**
 * An editorial reveal: content sits hidden behind a clip, then wipes up into place.
 * Used sparingly for the *primary* element of a section, never for every child.
 * Pass a per-line/element delay to cascade a few items with intent.
 */
export function reveal(delay = 0, duration = DURATION.editorial) {
  return {
    hidden: { opacity: 0, y: "0.6em", clipPath: "inset(0 0 100% 0)" },
    show: {
      opacity: 1,
      y: 0,
      clipPath: "inset(0 0 -10% 0)",
      transition: { duration, ease: EASE.out, delay },
    },
  };
}

/** A quieter fade+lift for supporting elements that shouldn't compete with the reveal. */
export function riseIn(delay = 0, distance = 14) {
  return {
    hidden: { opacity: 0, y: distance },
    show: { opacity: 1, y: 0, transition: { duration: DURATION.ui, ease: EASE.out, delay } },
  };
}
