"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { AppLink } from "@/components/AppLink";
import { ArrowDown, ArrowUpRight } from "@/components/icons";
import { Magnetic } from "@/components/motion/Magnetic";
import { DURATION, EASE, SPRING_SOFT } from "@/lib/motion";
import { HERO_VIDEO } from "@/lib/site";

// One editorial line: masked by its parent's overflow, wiping up into place. A little
// bottom padding keeps descenders (p, y, g) from being clipped by the mask.
function Line({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
      <motion.span
        className="block"
        initial={{ y: "115%" }}
        animate={{ y: 0 }}
        transition={{ duration: DURATION.cinematic, ease: EASE.out, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Scroll parallax: the video drifts down and eases in as the hero scrolls away.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.14]);

  // Cursor displacement: the frame leans a few pixels toward the pointer. Sprung so it feels
  // like weight, not a cursor-lock. Small numbers on purpose — this is atmosphere, not a toy.
  const mx = useSpring(useMotionValue(0), SPRING_SOFT);
  const my = useSpring(useMotionValue(0), SPRING_SOFT);
  const onPointerMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch") return;
    const { innerWidth, innerHeight } = window;
    mx.set((e.clientX / innerWidth - 0.5) * 24);
    my.set((e.clientY / innerHeight - 0.5) * 24);
  };

  return (
    <section
      ref={sectionRef}
      onPointerMove={onPointerMove}
      className="relative h-screen min-h-[600px] overflow-hidden bg-foreground"
      aria-labelledby="hero-heading"
    >
      {/* Scroll parallax layer */}
      <motion.div className="absolute inset-0" style={reduce ? undefined : { y: videoY, scale: videoScale }}>
        {/* Cursor-displacement layer (slightly overscaled so the lean never reveals an edge) */}
        <motion.div className="absolute inset-[-4%]" style={reduce ? undefined : { x: mx, y: my }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        </motion.div>
      </motion.div>

      <div className="absolute inset-0 bg-foreground/40" />
      <div className="absolute inset-0 bg-gradient-to-tr from-foreground/70 via-foreground/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-soft-light hero-grain" aria-hidden="true" />

      {/* Asymmetric composition: content anchored lower-left, not dead-centre. */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 flex flex-col justify-end pb-[14vh]">
        <div className="max-w-4xl">
          <motion.p
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: DURATION.editorial, ease: EASE.out, delay: 0.1 }}
            className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-6"
          >
            Strategic Outsourcing, Human Intelligence
          </motion.p>

          <h1
            id="hero-heading"
            className="font-heading text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-medium text-background leading-[0.98]"
          >
            <Line delay={0.25}>Where people, talent</Line>
            <Line delay={0.4}>
              and technology{" "}
              <em className="italic font-normal [font-variation-settings:'WONK'_1,'SOFT'_8]">connect</em>
            </Line>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.editorial, ease: EASE.out, delay: 0.7 }}
            className="mt-8 text-lg sm:text-xl text-background/80 max-w-xl leading-relaxed"
          >
            We build dedicated teams that scale your business through human intelligence — HR, finance, customer service,
            and operations, orchestrated as one.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.ui, ease: EASE.out, delay: 0.95 }}
            className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-x-8 gap-y-4"
          >
            <Magnetic strength={16}>
              <AppLink
                href="/#testimonials"
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-background text-foreground rounded-full text-sm font-medium hover:bg-background/90 transition-colors"
              >
                Meet our people
                <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </AppLink>
            </Magnetic>
            <AppLink
              href="/#services"
              className="text-background/80 text-sm font-medium hover:text-background transition-colors underline underline-offset-4 decoration-background/30"
            >
              What we do
            </AppLink>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.ui, delay: 1.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        aria-hidden="true"
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-background/50"
        >
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
