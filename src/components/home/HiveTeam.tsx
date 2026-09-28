"use client";

import { motion } from "framer-motion";
import { VIDEO_STORIES } from "@/lib/stories";

// Our employees, using the poster frames from their video stories.
const TEAM = VIDEO_STORIES.slice(0, 7).map((s) => ({ url: s.poster, name: s.name, role: s.role }));

const HEXAGON = { clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" };

function HexMember({ member }: { member: (typeof TEAM)[number] }) {
  return (
    <li className="relative group w-20 h-24 md:w-24 md:h-28" style={HEXAGON}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size portraits, rendered exactly like the original */}
      <img
        src={member.url}
        alt={member.name}
        width={720}
        height={1280}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
      />
      <div
        className="absolute inset-0 bg-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
        style={HEXAGON}
      >
        <div className="text-center text-background px-2">
          <p className="font-heading font-medium text-sm leading-tight">{member.name}</p>
          {member.role && <p className="text-[11px] text-background/70 mt-0.5">{member.role}</p>}
        </div>
      </div>
    </li>
  );
}

export function HiveTeam() {
  return (
    <section className="py-24 lg:py-32 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto" aria-labelledby="hive-heading">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
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
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-start w-fit mx-auto"
          >
            <ul className="flex gap-2 md:gap-3">
              {TEAM.slice(0, 4).map((member) => (
                <HexMember key={member.name} member={member} />
              ))}
            </ul>
            {/* Honeycomb offset: shift by half a cell (hex width + gap) / 2, and tuck up so the
                slanted edges keep the same gap as the vertical ones. */}
            <ul className="flex gap-2 md:gap-3 ml-[44px] md:ml-[54px] -mt-[15px] md:-mt-[14px]">
              {TEAM.slice(4, 7).map((member) => (
                <HexMember key={member.name} member={member} />
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
