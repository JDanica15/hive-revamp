"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApplicationReceived, JobDetails } from "@/components/careers/JobApplication";
import { MapPin, Send, X } from "@/components/icons";
import type { JobListing } from "@/lib/data";

const DEPARTMENTS = [
  "All",
  "Human Resources",
  "Finance & Bookkeeping",
  "Customer Service",
  "Operations",
  "Technology",
  "Administration",
];

const MotionLink = motion.create(Link);

export function JobBoard({ jobs }: { jobs: JobListing[] }) {
  const [department, setDepartment] = useState("All");
  const [selected, setSelected] = useState<JobListing | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const visible = department === "All" ? jobs : jobs.filter((job) => job.department === department);
  const close = () => {
    setSelected(null);
    setSubmitted(false);
  };

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-12" role="group" aria-label="Filter by department">
        {DEPARTMENTS.map((d) => (
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

      {visible.length === 0 ? (
        <p className="text-muted-foreground text-center py-20">
          No open positions in this category right now. Check back soon.
        </p>
      ) : (
        <ul className="space-y-px bg-border border border-border rounded-sm overflow-hidden">
          {visible.map((job, i) => (
            <li key={job.id}>
              {/* A real link (crawlable, opens the job page in a new tab); a normal click opens the panel like the original. */}
              <MotionLink
                href={`/careers/${job.id}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                onClick={(e) => {
                  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  setSelected(job);
                  setSubmitted(false);
                }}
                className="group w-full text-left bg-background p-6 lg:p-8 hover:bg-card transition-colors flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8"
              >
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
                </div>
                <div className="flex lg:flex-col lg:items-end gap-4 lg:gap-2 lg:w-48 shrink-0">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" /> {job.location}
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    Initiate Application
                    <Send className="w-3.5 h-3.5" />
                  </span>
                </div>
              </MotionLink>
            </li>
          ))}
        </ul>
      )}

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
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-lg bg-background z-[80] overflow-y-auto"
            >
              <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wider uppercase text-accent">{selected.department}</p>
                  <h3 id="job-panel-title" className="font-heading text-xl font-medium mt-1">
                    {selected.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {submitted ? (
                <ApplicationReceived job={selected} onClose={close} />
              ) : (
                <JobDetails key={selected.id} job={selected} onSubmitted={() => setSubmitted(true)} />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
