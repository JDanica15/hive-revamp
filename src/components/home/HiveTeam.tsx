"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { TeamPortrait } from "@/components/home/TeamPortrait";
import { DURATION, EASE } from "@/lib/motion";

// The team as a slowly turning globe of hex portraits (ported from the Base44 "hive-globe" prototype).
// Points are spread over a sphere (Fibonacci lattice); each frame we rotate them, project with a
// simple perspective, and fade/shrink the ones at the back. Drag, swipe or use the arrow keys to
// spin it; hovering pauses it and shows the role. A click (not a drag) opens the photo full size.
type Tile = { url: string; name: string; short?: string; role?: string; focus?: string; center?: boolean };

const CORE_TEAM: { name: string; slug: string; short?: string; role: string; focus?: string; ext?: string }[] = [
  { name: "Honey Lei Amar", slug: "honey", short: "Honey", role: "Client Success", focus: "50% 18%" },
  { name: "Myra Flor", slug: "myra", short: "Myra", role: "Operations", focus: "50% 18%" },
  { name: "Danica", slug: "danica", role: "Quality", focus: "50% 0%" },
  { name: "May Ann Basallote", slug: "mayann", short: "May Ann", role: "Team Lead", focus: "50% 18%" },
  { name: "Dia", slug: "dia", role: "Recruitment" },
  { name: "Ivie", slug: "ivie", role: "Customer Support", ext: "png" },
  { name: "Babelyn Bendana", slug: "babelyn", short: "Babelyn", role: "Workforce Planning", focus: "50% 18%" },
  { name: "Jayrrah", slug: "jayrrah", role: "Training", ext: "png" },
  { name: "Angela", slug: "angela", role: "Accounts" },
  { name: "Jilian", slug: "jilian", role: "Data Operations" },
  { name: "Mikee Cid", slug: "mikee", short: "Mikee", role: "IT Support" },
  { name: "Ylaiza", slug: "ylaiza", role: "Compliance", ext: "png" },
  { name: "Gretchen Obligar", slug: "gretchen", short: "Gretchen", role: "People & Culture", focus: "50% 18%" },
];

const TILES: Tile[] = CORE_TEAM.map((s) => ({
  url: `/media/team/${s.slug}.${s.ext ?? "jpg"}`,
  name: s.name,
  short: s.short,
  role: s.role,
  focus: s.focus,
}));

const SPIN = 0.17; // idle rotation, radians per second
const TILT = -0.1; // fixed tilt of the globe's axis

/** Evenly spread points on a unit sphere. */
function fibonacciSphere(n: number) {
  const golden = Math.PI * (1 + Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    return { x: Math.cos(golden * i) * r, y, z: Math.sin(golden * i) * r };
  });
}

function HiveGlobe({ members, onOpen }: { members: Tile[]; onOpen: (index: number) => void }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const scrims = useRef<(HTMLSpanElement | null)[]>([]);
  const points = useMemo(() => fibonacciSphere(members.length), [members.length]);
  const st = useRef({
    angle: -0.55,
    velocity: 0,
    dragging: false,
    paused: false,
    reduceMotion: false,
    pointerX: 0,
    startX: 0,
    startY: 0,
    moved: 0,
    downIndex: -1,
    pointerTime: 0,
    radius: 170,
    focal: 440,
    last: 0,
  });

  // Card size and sphere radius follow the container.
  const measure = useCallback(() => {
    const el = sceneRef.current;
    if (!el) return;
    const side = Math.min(el.clientWidth, el.clientHeight);
    if (!side) return;
    const card = Math.min(Math.max(side * 0.168, 60), 104);
    el.style.setProperty("--hive-card", `${card.toFixed(1)}px`);
    st.current.radius = Math.max(46, side / 2 - card * 1.18);
    st.current.focal = st.current.radius * 2.6;
  }, []);

  useEffect(() => {
    measure();
    const el = sceneRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    st.current.reduceMotion = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      st.current.reduceMotion = e.matches;
    };
    mq.addEventListener("change", onChange);

    let raf = 0;
    const frame = (now: number) => {
      const s = st.current;
      const dt = s.last ? Math.min((now - s.last) / 1000, 0.05) : 0.016;
      s.last = now;
      if (!s.dragging && !s.paused && !s.reduceMotion) s.angle += SPIN * dt;
      if (s.velocity !== 0) {
        s.angle += s.velocity * dt;
        s.velocity *= 0.9 ** (dt * 60); // inertia after a flick
        if (Math.abs(s.velocity) < 0.003) s.velocity = 0;
      }
      const { radius, focal } = s;
      if (radius > 0) {
        const cos = Math.cos(s.angle);
        const sin = Math.sin(s.angle);
        const cosT = Math.cos(TILT);
        const sinT = Math.sin(TILT);
        for (let i = 0; i < points.length; i += 1) {
          const node = nodes.current[i];
          if (!node) continue;
          const p = points[i];
          const x1 = p.x * cos + p.z * sin; // rotate about the vertical axis
          const z1 = p.z * cos - p.x * sin;
          const y2 = p.y * cosT - z1 * sinT; // then tilt
          const z2 = p.y * sinT + z1 * cosT;
          const scale = focal / (focal - z2 * radius); // perspective
          const front = (z2 + 1) / 2; // 0 = back of the globe, 1 = front
          node.style.transform = `translate(-50%, -50%) translate(${(x1 * radius * scale).toFixed(2)}px, ${(y2 * radius * scale).toFixed(2)}px) scale(${scale.toFixed(3)})`;
          node.style.opacity = (0.5 + 0.5 * front ** 1.2).toFixed(3);
          node.style.setProperty("--front", front.toFixed(3));
          node.style.zIndex = String(Math.round(front * 1000));
          const scrim = scrims.current[i];
          if (scrim) scrim.style.opacity = ((1 - front) * 0.2).toFixed(3);
        }
      }
      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(raf);
      mq.removeEventListener("change", onChange);
    };
  }, [points]);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    s.dragging = true;
    s.velocity = 0;
    s.pointerX = s.startX = e.clientX;
    s.startY = e.clientY;
    s.moved = 0;
    const node = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
    s.downIndex = node ? Number(node.dataset.index) : -1;
    s.pointerTime = e.timeStamp || performance.now();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (!s.dragging) return;
    const now = e.timeStamp || performance.now();
    const dx = e.clientX - s.pointerX;
    const dt = Math.max((now - s.pointerTime) / 1000, 0.016);
    const turn = dx * 0.0062;
    s.angle += turn;
    s.velocity = Math.max(-3, Math.min(3, (turn / dt) * 0.45));
    s.moved = Math.max(s.moved, Math.hypot(e.clientX - s.startX, e.clientY - s.startY));
    s.pointerX = e.clientX;
    s.pointerTime = now;
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    s.dragging = false;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (e.pointerType !== "mouse") s.paused = false;
    // A tap that barely moved opens the portrait instead of spinning the globe.
    if (e.type === "pointerup" && s.moved < 6 && s.downIndex >= 0) onOpen(s.downIndex);
    s.downIndex = -1;
  };

  return (
    <div className="hive-globe-frame">
      <div
        ref={sceneRef}
        className="hive-scene"
        role="group"
        tabIndex={0}
        aria-label="Interactive globe of the Hive team. Drag, swipe or use the arrow keys to rotate."
        onPointerEnter={() => {
          st.current.paused = true;
        }}
        onPointerLeave={() => {
          st.current.paused = false;
          st.current.dragging = false;
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            st.current.angle += e.key === "ArrowLeft" ? -0.24 : 0.24;
          }
        }}
      >
        <div className="hive-glow" aria-hidden="true" />
        {members.map((m, i) => (
          <div
            key={m.name}
            data-index={i}
            className="hive-node"
            ref={(el) => {
              nodes.current[i] = el;
            }}
          >
            <div className="hive-node-inner">
              <div className="hive-hex">
                {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size portraits */}
                <img
                  src={m.url}
                  alt={m.name}
                  width={360}
                  height={360}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  style={{ objectPosition: m.focus ?? "50% 50%" }}
                />
                <span
                  className="hive-scrim"
                  aria-hidden="true"
                  ref={(el) => {
                    scrims.current[i] = el;
                  }}
                />
              </div>
              <span className="hive-name">{m.short ?? m.name.split(" ")[0]}</span>
              {m.role && <span className="hive-role">{m.role}</span>}
            </div>
          </div>
        ))}
      </div>
      <p className="hive-hint">Drag to explore</p>
    </div>
  );
}

export function HiveTeam() {
  // Index into TILES of the photo shown full size, or null when the lightbox is closed.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const step = useCallback(
    (delta: number) => setOpenIndex((i) => (i === null ? i : (i + delta + TILES.length) % TILES.length)),
    [],
  );
  const close = useCallback(() => setOpenIndex(null), []);

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
          <HiveGlobe members={TILES} onOpen={setOpenIndex} />
        </div>
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <TeamPortrait
            portrait={TILES[openIndex]}
            onClose={close}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
