"use client";

import { motion } from "framer-motion";

const TEAM = [
  { url: "/media/photo-1494790108377-be9c29b29330-17xle2a.jpg", name: "Sarah Chen", role: "Customer Service Lead" },
  {
    url: "https://images.unsplash.com/photo-1507003211169-0b1dd7c53394?w=300&h=350&fit=crop",
    name: "Marcus Reid",
    role: "HR Partner",
  },
  { url: "/media/photo-1438761681033-6461ffad8d80-1w3ghus.jpg", name: "Aisha Patel", role: "Finance Specialist" },
  {
    url: "https://images.unsplash.com/photo-1500648766831-d4f8f66f6e3e?w=300&h=350&fit=crop",
    name: "James O'Brien",
    role: "Operations Manager",
  },
  {
    url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f4e?w=300&h=350&fit=crop",
    name: "Sofia Martinez",
    role: "Client Success",
  },
  { url: "/media/photo-1472099645785-5658abf4ff4e-1ugyw6q.jpg", name: "David Kim", role: "Technology Lead" },
  { url: "/media/photo-1544005313-94ddf0286df2-1gwa1py.jpg", name: "Emma Thompson", role: "Admin Coordinator" },
];

const HEXAGON = { clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" };

function HexMember({ member }: { member: (typeof TEAM)[number] }) {
  return (
    <li className="relative group w-20 h-24 md:w-24 md:h-28" style={HEXAGON}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size portraits, rendered exactly like the original */}
      <img
        src={member.url}
        alt={member.name}
        width={300}
        height={350}
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
          <p className="text-[11px] text-background/70 mt-0.5">{member.role}</p>
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
            className="flex flex-col items-center"
          >
            <ul className="flex gap-2 md:gap-3">
              {TEAM.slice(0, 4).map((member) => (
                <HexMember key={member.name} member={member} />
              ))}
            </ul>
            <ul className="flex gap-2 md:gap-3 ml-10 md:ml-12 -mt-5 md:-mt-6">
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
