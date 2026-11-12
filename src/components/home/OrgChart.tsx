"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { SmartImage } from "@/components/SmartImage";
import type { Testimonial } from "@/lib/data";
import { DURATION, EASE } from "@/lib/motion";

// "Our People" as an org chart built like a honeycomb: each person is a hex cell, and the
// reporting lines are honey-coloured links that meet in small hex "hub" cells.
// The tree comes from `reports_to` in testimonials.json, so reshuffling the team is a data edit.

// Layout units (the SVG viewBox and the % positions of the people share them).
const SLOT = 100; // width given to each person in the bottom-most row of a branch
const HEX_W = 74;
const HEX_H = HEX_W * (2 / Math.sqrt(3)); // pointy-top hex
const LABEL = 58; // name + role under each hex
const LINK = 52; // vertical run between a label and the next row
const ROW = HEX_H + LABEL + LINK;

const HEXAGON = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

type Node = { person: Testimonial; x: number; depth: number; children: Node[] };

/** Classic tidy-tree: leaves take the next free slot, parents sit centred over their children. */
function layout(people: Testimonial[]) {
  const ids = new Set(people.map((p) => p.id));
  const kids = (id: string | null) =>
    people.filter((p) => (p.reports_to && ids.has(p.reports_to) ? p.reports_to : null) === id && p.id !== id);

  let nextSlot = 0;
  const nodes: Node[] = [];
  const place = (person: Testimonial, depth: number, seen: Set<string>): Node => {
    seen.add(person.id);
    const children = kids(person.id)
      .filter((c) => !seen.has(c.id))
      .map((c) => place(c, depth + 1, seen));
    const x = children.length
      ? (children[0].x + children[children.length - 1].x) / 2
      : (nextSlot++ + 0.5) * SLOT;
    const node = { person, x, depth, children };
    nodes.push(node);
    return node;
  };
  const seen = new Set<string>();
  kids(null).forEach((root) => place(root, 0, seen));

  const depth = Math.max(0, ...nodes.map((n) => n.depth)) + 1;
  return { nodes, width: Math.max(1, nextSlot) * SLOT, height: depth * ROW - LINK };
}

/** A small flat hex centred on (x, y) — the "hub" cells where links meet. */
function hubPoints(x: number, y: number, r = 7) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(x + r * Math.cos(a)).toFixed(2)},${(y + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

export function OrgChart({
  people,
  selectedId,
  onSelect,
}: {
  people: Testimonial[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const reduce = useReducedMotion();
  const patternId = useId();
  const { nodes, width, height } = layout(people);
  const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;

  const draw = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { pathLength: 0, opacity: 0 },
          whileInView: { pathLength: 1, opacity: 1 },
          viewport: { once: true },
          transition: { duration: DURATION.cinematic, ease: EASE.out, delay },
        };

  return (
    <div className="relative w-full max-w-[600px] mx-auto" style={{ aspectRatio: `${width} / ${height}` }}>
      <svg
        className="absolute inset-0 w-full h-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        {/* Faint honeycomb behind the chart, fading out towards the edges. */}
        <defs>
          <pattern id={`${patternId}-comb`} width="24" height="41.57" patternUnits="userSpaceOnUse">
            <path
              d="M12 0 L24 6.93 L24 20.78 L12 27.71 L0 20.78 L0 6.93 Z M12 27.71 L12 41.57"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeOpacity="0.12"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id={`${patternId}-fade`}>
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id={`${patternId}-mask`}>
            <rect x={-40} y={-40} width={width + 80} height={height + 80} fill={`url(#${patternId}-fade)`} />
          </mask>
        </defs>
        <rect
          x={-40}
          y={-40}
          width={width + 80}
          height={height + 80}
          fill={`url(#${patternId}-comb)`}
          mask={`url(#${patternId}-mask)`}
        />

        {nodes
          .filter((n) => n.children.length)
          .map((parent) => {
            const top = parent.depth * ROW;
            const hubY = top + HEX_H + LABEL + LINK / 2;
            return (
              <g key={parent.person.id}>
                {/* Trunk: from the parent's bottom point, behind its name tag, down to the hub. */}
                <motion.path
                  d={`M${parent.x} ${top + HEX_H} V${hubY}`}
                  stroke="hsl(var(--accent))"
                  strokeWidth="2"
                  fill="none"
                  {...draw(0.1 + parent.depth * 0.4)}
                />
                {parent.children.map((child) => (
                  <motion.path
                    key={child.person.id}
                    d={`M${parent.x} ${hubY} H${child.x} V${child.depth * ROW}`}
                    stroke="hsl(var(--accent))"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    fill="none"
                    {...draw(0.35 + parent.depth * 0.4)}
                  />
                ))}
                <polygon points={hubPoints(parent.x, hubY, 8)} fill="hsl(var(--accent))" />
                {parent.children.map((child) => (
                  <polygon
                    key={child.person.id}
                    points={hubPoints(child.x, hubY, 4.5)}
                    fill="hsl(var(--background))"
                    stroke="hsl(var(--accent))"
                    strokeWidth="2"
                  />
                ))}
              </g>
            );
          })}
      </svg>

      <ul>
        {nodes.map(({ person, x, depth }) => {
          const active = person.id === selectedId;
          const top = depth * ROW;
          return (
            <li
              key={person.id}
              className="absolute flex flex-col items-center"
              style={{
                left: pct(x - SLOT / 2, width),
                top: pct(top, height),
                width: pct(SLOT, width),
              }}
            >
              <motion.button
                type="button"
                onClick={() => onSelect(person.id)}
                aria-pressed={active}
                aria-label={`${person.employee_name}, ${person.role}`}
                className="relative block"
                style={{ width: `${(HEX_W / SLOT) * 100}%`, aspectRatio: `${HEX_W} / ${HEX_H}` }}
                whileHover={reduce ? undefined : { scale: 1.06 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                transition={{ duration: DURATION.micro, ease: EASE.out }}
              >
                {/* Frame hex: honey when selected, a quiet border otherwise. */}
                <span
                  className={"absolute inset-0 transition-colors " + (active ? "bg-accent" : "bg-border")}
                  style={{ clipPath: HEXAGON }}
                />
                <span className="absolute inset-[5%] overflow-hidden bg-muted" style={{ clipPath: HEXAGON }}>
                  <SmartImage
                    src={person.photo_url}
                    alt=""
                    fill
                    sizes="120px"
                    className={
                      "object-cover transition-[filter,opacity] duration-300 " +
                      (active ? "" : "grayscale-[35%] opacity-90")
                    }
                  />
                </span>
              </motion.button>
              {/* Name tag sits over the trunk line, so links read as threading through it. */}
              <div className="mt-1.5 px-1.5 bg-background text-center max-w-full">
                <p
                  className={
                    "font-heading font-semibold text-[11px] sm:text-sm leading-tight truncate " +
                    (active ? "text-accent" : "text-foreground")
                  }
                >
                  {person.employee_name.split(" ")[0]}
                </p>
                <p className="text-[9px] sm:text-[11px] leading-tight text-muted-foreground line-clamp-2">
                  {person.role}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
