"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { DURATION, EASE, SPRING_SOFT } from "@/lib/motion";
import { VIDEO_STORIES } from "@/lib/stories";

// A "flower" of seven flat-topped hexes, like a framed photo-tile wall: the team photo in the
// middle and six of our employees (poster frames from their video stories) around it.
// Positions are in honeycomb "cell" units (cx = column, cy = row) so we can measure how close
// each hex is to the hovered one and let neighbours react by proximity — a physical comb.
type Tile = { url: string; name: string; role?: string; cx: number; cy: number; focus?: string; center?: boolean };

// Clockwise from the top, around the centre.
const RING = [
  [0, -1],
  [1, -0.5],
  [1, 0.5],
  [0, 1],
  [-1, 0.5],
  [-1, -0.5],
] as const;

const TILES: Tile[] = [
  {
    url: "/media/gallery/hotel-st-elise/01.jpg",
    name: "The Hive team",
    cx: 0,
    cy: 0,
    focus: "50% 60%",
    center: true,
  },
  ...VIDEO_STORIES.slice(0, 6).map((s, i) => ({
    url: s.poster,
    name: s.name,
    role: s.role,
    cx: RING[i][0],
    cy: RING[i][1],
  })),
];

// Geometry, with the hex width as 1: a flat-top hex is √3/2 as tall as it is wide, and
// neighbouring columns overlap by a quarter width. GAP is the frame between tiles.
const HEX_H = Math.sqrt(3) / 2;
const GAP = 0.05;
const COL_STEP = 0.75 + GAP * HEX_H;
const ROW_STEP = HEX_H + GAP;
const BOX_W = 1 + 2 * COL_STEP;
const BOX_H = HEX_H + 2 * ROW_STEP;
const pct = (n: number) => `${(n * 100).toFixed(3)}%`;

const HEXAGON = { clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" };
const dist = (a: Tile, b: Tile) => Math.hypot(a.cx - b.cx, a.cy - b.cy);

function HexMember({
  member,
  hovered,
  onHover,
  reduce,
}: {
  member: Tile;
  hovered: Tile | null;
  onHover: (m: Tile | null) => void;
  reduce: boolean;
}) {
  const isActive = hovered === member;
  // proximity: 1 = adjacent to the hovered hex, 0 = far across the comb.
  const proximity = hovered ? Math.max(0, 1 - dist(member, hovered) / 2.2) : 0;
  const firstName = member.name.split(" ")[0];

  const target =
    reduce || !hovered
      ? { scale: 1, opacity: 1, y: 0 }
      : isActive
        ? { scale: 1.08, opacity: 1, y: -4 }
        : { scale: 0.95 + 0.03 * proximity, opacity: 0.45 + 0.28 * proximity, y: 0 };

  return (
    <motion.li
      className="absolute cursor-pointer"
      style={{
        ...HEXAGON,
        width: pct(1 / BOX_W),
        height: pct(HEX_H / BOX_H),
        left: pct(((member.cx + 1) * COL_STEP) / BOX_W),
        top: pct(((member.cy + 1) * ROW_STEP) / BOX_H),
        zIndex: isActive ? 20 : Math.round(proximity * 10),
      }}
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
        style={{ objectPosition: member.focus ?? "50% 30%" }}
      />
      {/* Handwritten first name along the bottom edge, like a signed photo tile. */}
      {!member.center && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" aria-hidden />
          <p
            className="absolute inset-x-0 bottom-[7%] text-center font-script text-lg sm:text-2xl leading-none text-white drop-shadow"
            aria-hidden
          >
            {firstName}
          </p>
        </>
      )}
      <motion.div
        className="absolute inset-0 bg-foreground/70 flex items-center justify-center"
        style={HEXAGON}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: DURATION.micro, ease: EASE.out }}
      >
        <div className="text-center text-background px-4">
          <p className="font-heading font-medium text-sm sm:text-base leading-tight">{member.name}</p>
          {member.role && <p className="text-[11px] sm:text-xs text-background/70 mt-0.5">{member.role}</p>}
        </div>
      </motion.div>
    </motion.li>
  );
}

export function HiveTeam() {
  const reduce = useReducedMotion() ?? false;
  const [hovered, setHovered] = useState<Tile | null>(null);

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
            className="relative w-full max-w-[520px] mx-auto"
            style={{ aspectRatio: `${BOX_W} / ${BOX_H}` }}
          >
            <ul>
              {TILES.map((member) => (
                <HexMember key={member.name} member={member} hovered={hovered} onHover={setHovered} reduce={reduce} />
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
