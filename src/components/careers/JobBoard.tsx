"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApplicationForm, ApplicationReceived } from "@/components/careers/JobApplication";
import { JobMeta, JobOverview } from "@/components/careers/JobOverview";
import { ArrowUpRight, ChevronRight, Clock, MapPin, Search, Sparkles, X } from "@/components/icons";
import { GENERAL_APPLICATION } from "@/lib/careers";
import type { JobListing } from "@/lib/data";
import { formatShortDate } from "@/lib/format";

type Selection = { kind: "job"; job: JobListing } | { kind: "general" };

const SELECT =
  "bg-background border border-border rounded-full pl-4 pr-9 py-2 text-sm text-foreground focus:border-accent focus:outline-none transition-colors appearance-none cursor-pointer";

function FilterSelect({ label, value, options, allLabel, onChange }: {
  label: string;
  value: string;
  options: string[];
  allLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <span className="relative inline-flex">
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={SELECT}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "All" ? allLabel : o}
          </option>
        ))}
      </select>
      <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </span>
  );
}

const locationGroup = (location: string) =>
  /remote/i.test(location) && /sydney/i.test(location) ? "Hybrid" : /remote/i.test(location) ? "Remote" : "On-site";

export function JobBoard({ jobs }: { jobs: JobListing[] }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [type, setType] = useState("All");
  const [workplace, setWorkplace] = useState("All");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const departments = useMemo(() => ["All", ...Array.from(new Set(jobs.map((j) => j.department))).sort()], [jobs]);
  const types = useMemo(() => ["All", ...Array.from(new Set(jobs.map((j) => j.employment_type))).sort()], [jobs]);
  const workplaces = ["All", "Remote", "Hybrid", "On-site"].filter(
    (w) => w === "All" || jobs.some((j) => locationGroup(j.location) === w),
  );

  const q = query.trim().toLowerCase();
  const visible = jobs.filter(
    (j) =>
      (department === "All" || j.department === department) &&
      (type === "All" || j.employment_type === type) &&
      (workplace === "All" || locationGroup(j.location) === workplace) &&
      (!q || [j.title, j.summary, j.department, j.location].some((s) => s.toLowerCase().includes(q))),
  );
  const filtered = q || department !== "All" || type !== "All" || workplace !== "All";
  const reset = () => {
    setQuery("");
    setDepartment("All");
    setType("All");
    setWorkplace("All");
  };

  const open = (s: Selection) => {
    setSelected(s);
    setSubmitted(false);
  };
  const close = () => {
    setSelected(null);
    setSubmitted(false);
  };

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected]);

  const target = selected?.kind === "job" ? selected.job : GENERAL_APPLICATION;

  return (
    <div>
      {/* Filters */}
      <div className="space-y-5 mb-10">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles, teams or locations"
            aria-label="Search open roles"
            className="w-full bg-background border border-border rounded-full pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by department">
          {departments.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDepartment(d)}
              aria-pressed={department === d}
              className={
                "px-4 py-2 rounded-full text-sm font-medium transition-colors " +
                (department === d
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground")
              }
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect label="Employment type" value={type} options={types} allLabel="All employment types" onChange={setType} />
          <FilterSelect label="Workplace" value={workplace} options={workplaces} allLabel="All workplaces" onChange={setWorkplace} />
          <p className="text-sm text-muted-foreground ml-auto" aria-live="polite">
            {visible.length} {visible.length === 1 ? "role" : "roles"}
            {filtered && (
              <>
                {" · "}
                <button type="button" onClick={reset} className="text-accent hover:underline">
                  Clear filters
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Listings */}
      {visible.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm">
          <p className="text-muted-foreground">No open positions match your search right now.</p>
          <button type="button" onClick={reset} className="mt-3 text-accent hover:underline text-sm">
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="space-y-px bg-border border border-border rounded-sm overflow-hidden">
          {visible.map((job, i) => (
            <motion.li
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
            >
              {/* A real link (crawlable, opens the job page in a new tab); a normal click opens the panel. */}
              <Link
                href={`/careers/${job.id}`}
                onClick={(e) => {
                  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  open({ kind: "job", job });
                }}
                className="group relative w-full text-left bg-background p-6 lg:p-8 hover:bg-card transition-colors flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-10"
              >
                <span className="absolute left-0 top-0 bottom-0 w-px bg-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs tracking-wider uppercase text-accent font-medium">{job.department}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{job.employment_type}</span>
                  </div>
                  <h3 className="font-heading text-2xl font-medium group-hover:text-accent transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-[15px] max-w-2xl">{job.summary}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Posted {formatShortDate(job.posted_date)}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 self-start lg:self-center px-5 py-2.5 rounded-full border border-border text-sm font-medium text-foreground group-hover:bg-foreground group-hover:text-background group-hover:border-foreground transition-colors shrink-0">
                  Apply now
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}

      {/* General application */}
      <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 lg:p-10 rounded-sm bg-foreground text-background">
        <div className="flex items-start gap-4">
          <span className="w-11 h-11 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-accent" />
          </span>
          <div>
            <h3 className="font-heading text-2xl font-medium">Don&apos;t see your role?</h3>
            <p className="text-background/70 mt-1 max-w-xl">
              Send us your resume anyway. We&apos;ll reach out when an opportunity matches your skills.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => open({ kind: "general" })}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-accent text-accent-foreground rounded-full text-sm font-medium hover:bg-accent/90 transition-colors shrink-0"
        >
          Submit your resume
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Application panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[70]"
            />
            <motion.div
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="job-panel-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-xl bg-background z-[80] overflow-y-auto"
            >
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-6 sm:px-8 py-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs tracking-wider uppercase text-accent">{target.department}</p>
                  <h3 id="job-panel-title" className="font-heading text-xl font-medium mt-1 truncate">
                    {target.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="p-2 rounded-full hover:bg-muted transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {submitted ? (
                <ApplicationReceived job={target} onClose={close} />
              ) : (
                <div className="px-6 sm:px-8 py-8 space-y-10">
                  {selected.kind === "job" ? (
                    <div className="space-y-8">
                      <JobMeta job={selected.job} />
                      <JobOverview job={selected.job} />
                      <Link
                        href={`/careers/${selected.job.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                      >
                        Open full job page
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      Tell us about yourself and the kind of role you&apos;re looking for. Our recruitment team keeps
                      every resume on file and will contact you when a suitable position opens.
                    </p>
                  )}
                  <div className="pt-8 border-t border-border">
                    <h4 className="font-heading text-2xl font-medium mb-6">
                      {selected.kind === "job" ? "Apply for this role" : "Join our talent community"}
                    </h4>
                    <ApplicationForm key={target.id} job={target} onSubmitted={() => setSubmitted(true)} />
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
