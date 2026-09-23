"use client";

import { useState, type FormEvent } from "react";
import { Briefcase, Check, LoaderCircle, MapPin } from "@/components/icons";
import type { JobListing } from "@/lib/data";

const FIELD =
  "w-full bg-background border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors";

const EMPTY = { applicant_name: "", applicant_email: "", phone: "", cover_note: "", resume_url: "" };

export function ApplicationReceived({ job, onClose }: { job: JobListing; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-24" role="status">
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
        <Check className="w-8 h-8 text-accent" />
      </div>
      <h3 className="font-heading text-2xl font-medium mb-3">Application Received</h3>
      <p className="text-muted-foreground max-w-sm">
        Thank you for your interest in {job.title}. Our recruitment team will review your application and be in touch.
      </p>
      <button type="button" onClick={onClose} className="mt-8 text-accent hover:underline text-sm">
        Close
      </button>
    </div>
  );
}

/** Role details and the application form (the body of the original slide-over panel). */
export function JobDetails({
  job,
  onSubmitted,
  headingLevel = "p",
}: {
  job: JobListing;
  onSubmitted: () => void;
  headingLevel?: "p" | "h2";
}) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const Heading = headingLevel;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, job_listing_id: job.id }),
      });
      setForm(EMPTY);
    } finally {
      // The original site confirms receipt even if the request fails.
      setSubmitting(false);
      onSubmitted();
    }
  };

  return (
    <div className="px-6 py-6">
      <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" /> {job.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Briefcase className="w-4 h-4" /> {job.employment_type}
        </span>
      </div>
      <div className="space-y-6 mb-8">
        <div>
          <Heading className="text-xs tracking-wider uppercase text-muted-foreground mb-2">About the Role</Heading>
          <p className="text-foreground leading-relaxed">{job.description}</p>
        </div>
        <div>
          <Heading className="text-xs tracking-wider uppercase text-muted-foreground mb-2">Requirements</Heading>
          <p className="text-foreground leading-relaxed">{job.requirements}</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-5 pt-6 border-t border-border" aria-label={`Apply for ${job.title}`}>
        <Heading className="font-heading text-lg font-medium">Initiate Application</Heading>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            required
            name="applicant_name"
            autoComplete="name"
            aria-label="Full name"
            placeholder="Full name *"
            value={form.applicant_name}
            onChange={(e) => setForm({ ...form, applicant_name: e.target.value })}
            className={FIELD}
          />
          <input
            required
            type="email"
            name="applicant_email"
            autoComplete="email"
            aria-label="Email"
            placeholder="Email *"
            value={form.applicant_email}
            onChange={(e) => setForm({ ...form, applicant_email: e.target.value })}
            className={FIELD}
          />
        </div>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          aria-label="Phone"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className={FIELD}
        />
        <input
          name="resume_url"
          aria-label="Resume or portfolio URL"
          placeholder="Resume / Portfolio URL"
          value={form.resume_url}
          onChange={(e) => setForm({ ...form, resume_url: e.target.value })}
          className={FIELD}
        />
        <textarea
          required
          name="cover_note"
          aria-label="Cover note"
          placeholder="Cover note *"
          rows={4}
          value={form.cover_note}
          onChange={(e) => setForm({ ...form, cover_note: e.target.value })}
          className="w-full bg-background border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors resize-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-foreground text-background rounded-full font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {submitting ? (
            <>
              <LoaderCircle className="w-4 h-4 animate-spin" /> Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </button>
      </form>
    </div>
  );
}
