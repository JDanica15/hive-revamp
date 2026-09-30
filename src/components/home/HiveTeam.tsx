"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { DURATION, EASE, SPRING_SOFT } from "@/lib/motion";
import { VIDEO_STORIES } from "@/lib/stories";

// Our employees, using the poster frames from their video stories.
// Positions are in honeycomb "cell" units so we can measure how close each hex is to the
// hovered one and let neighbours react by proximity — a physical comb, not a grid of buttons.
const TEAM = VIDEO_STORIES.slice(0, 7).map((s, i) => ({
  url: s.poster,
  name: s.name,
  role: s.role,
  // Row 0: four hexes; row 1: three, offset half a cell and tucked up.
  cx: i < 4 ? i : i - 4 + 0.5,
  cy: i < 4 ? 0 : 0.85,
}));

const HEXAGON = { clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" };
const dist = (a: (typeof TEAM)[number], b: (typeof TEAM)[number]) => Math.hypot(a.cx - b.cx, a.cy - b.cy);

function HexMember({
  member,
  hovered,
  onHover,
  reduce,
}: {
  member: (typeof TEAM)[number];
  hovered: (typeof TEAM)[number] | null;
  onHover: (m: (typeof TEAM)[number] | null) => void;
  reduce: boolean;
}) {
  const isActive = hovered === member;
  // proximity: 1 = adjacent to the hovered hex, 0 = far across the comb.
  const proximity = hovered ? Math.max(0, 1 - dist(member, hovered) / 2.2) : 0;

  const target =
    reduce || !hovered
      ? { scale: 1, opacity: 1, y: 0 }
      : isActive
        ? { scale: 1.1, opacity: 1, y: -4 }
        : { scale: 0.94 + 0.03 * proximity, opacity: 0.45 + 0.28 * proximity, y: 0 };

  return (
    <motion.li
      className="relative w-20 h-24 md:w-24 md:h-28 cursor-pointer"
      style={{ ...HEXAGON, zIndex: isActive ? 20 : Math.round(proximity * 10) }}
      animate={target}
      transition={SPRING_SOFT}
      onHoverStart={() => onHover(member)}
      onHoverEnd={() => onHover(null)}
      onFocus={() => onHover(member)}
      onBlur={() => onHover(null)}
      tabIndex={0}
      aria-label={member.role ? `${member.name}, ${member.role}` : member.name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size portraits */}
      <img
        src={member.url}
        alt=""
        width={720}
        height={1280}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
      />
      <motion.div
        className="absolute inset-0 bg-foreground/70 flex items-center justify-center"
        style={HEXAGON}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: DURATION.micro, ease: EASE.out }}
      >
        <div className="text-center text-background px-2">
          <p className="font-heading font-medium text-sm leading-tight">{member.name}</p>
          {member.role && <p className="text-[11px] text-background/70 mt-0.5">{member.role}</p>}
        </div>
      </motion.div>
    </motion.li>
  );
}

export function HiveTeam() {
  const reduce = useReducedMotion() ?? false;
  const [hovered, setHovered] = useState<(typeof TEAM)[number] | null>(null);

  return (
    <section className="py-24 lg:py-32 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto" aria-labelledby="hive-heading">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: DURATION.editorial, ease: EASE.out }}
          >
            <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">The Hive</p>
            <h2 id="hive-heading" className="font-heading text-4xl lg:text-5xl font-medium text-balance leading-tight mb-6">
              One global team, many stories
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Like a hive, our strength comes from connection. Every individual brings unique talent, and together we
              build something greater than the sum of its parts.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This is what global teamwork looks like — diverse people, shared purpose, and the human relationships
              behind every solution we deliver.
            </p>
          </motion.div>
        </div>
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: DURATION.cinematic, ease: EASE.cinematic }}
            onHoverEnd={() => setHovered(null)}
            className="flex flex-col items-start w-fit mx-auto"
          >
            <ul className="flex gap-2 md:gap-3">
              {TEAM.slice(0, 4).map((member) => (
                <HexMember key={member.name} member={member} hovered={hovered} onHover={setHovered} reduce={reduce} />
              ))}
            </ul>
            {/* Honeycomb offset: half a cell across, tucked up so slanted edges keep the same gap. */}
            <ul className="flex gap-2 md:gap-3 ml-[44px] md:ml-[54px] -mt-[15px] md:-mt-[14px]">
              {TEAM.slice(4, 7).map((member) => (
                <HexMember key={member.name} member={member} hovered={hovered} onHover={setHovered} reduce={reduce} />
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
