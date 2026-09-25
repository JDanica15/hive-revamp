"use client";

import { useId, useState, type FormEvent } from "react";
import { ResumeDropzone } from "@/components/careers/ResumeDropzone";
import { Check, CircleAlert, LoaderCircle } from "@/components/icons";
import { RESUME_REQUIRED } from "@/lib/careers";

type ApplyTarget = { id: string; title: string };

const LABEL = "block text-xs tracking-wider uppercase text-muted-foreground mb-2";
const FIELD =
  "w-full bg-background border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors";
const NOTE_MAX = 3000;

const EMPTY = { applicant_name: "", applicant_email: "", phone: "", portfolio_url: "", cover_note: "" };

export function ApplicationReceived({ job, onClose, closeLabel = "Close" }: { job: ApplyTarget; onClose: () => void; closeLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-20" role="status">
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
        <Check className="w-8 h-8 text-accent" />
      </div>
      <h3 className="font-heading text-2xl font-medium mb-3">Application Received</h3>
      <p className="text-muted-foreground max-w-sm">
        Thank you for your interest in {job.title}. Our recruitment team will review your application and be in touch.
      </p>
      <button type="button" onClick={onClose} className="mt-8 text-accent hover:underline text-sm">
        {closeLabel}
      </button>
    </div>
  );
}

export function ApplicationForm({ job, onSubmitted }: { job: ApplyTarget; onSubmitted: () => void }) {
  const uid = useId();
  const [form, setForm] = useState(EMPTY);
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (RESUME_REQUIRED && !resume) {
      setError("Please attach your resume.");
      return;
    }
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    body.append("job_listing_id", job.id);
    body.append("company_website", (e.currentTarget.elements.namedItem("company_website") as HTMLInputElement).value);
    if (resume) body.append("resume", resume, resume.name);

    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      setForm(EMPTY);
      setResume(null);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" aria-label={`Apply for ${job.title}`}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${uid}-name`} className={LABEL}>
            Full name *
          </label>
          <input id={`${uid}-name`} required autoComplete="name" placeholder="Your full name" value={form.applicant_name} onChange={set("applicant_name")} className={FIELD} />
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className={LABEL}>
            Email *
          </label>
          <input id={`${uid}-email`} required type="email" autoComplete="email" placeholder="you@email.com" value={form.applicant_email} onChange={set("applicant_email")} className={FIELD} />
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className={LABEL}>
            Phone
          </label>
          <input id={`${uid}-phone`} type="tel" autoComplete="tel" placeholder="+61 …" value={form.phone} onChange={set("phone")} className={FIELD} />
        </div>
        <div>
          <label htmlFor={`${uid}-portfolio`} className={LABEL}>
            LinkedIn / Portfolio
          </label>
          <input id={`${uid}-portfolio`} inputMode="url" autoComplete="url" placeholder="linkedin.com/in/…" value={form.portfolio_url} onChange={set("portfolio_url")} className={FIELD} />
        </div>
      </div>

      <ResumeDropzone file={resume} onChange={setResume} />

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${uid}-note`} className={LABEL}>
            Cover note *
          </label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {form.cover_note.length}/{NOTE_MAX}
          </span>
        </div>
        <textarea
          id={`${uid}-note`}
          required
          rows={5}
          maxLength={NOTE_MAX}
          placeholder="Tell us why you'd be a great fit…"
          value={form.cover_note}
          onChange={set("cover_note")}
          className={FIELD + " resize-none"}
        />
      </div>

      {/* Honeypot for bots — hidden from people and assistive tech. */}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {error && (
        <p className="flex items-start gap-2 p-3 rounded-sm bg-destructive/10 text-destructive text-sm" role="alert">
          <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-foreground text-background rounded-full font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {submitting ? (
            <>
              <LoaderCircle className="w-4 h-4 animate-spin" /> {resume ? "Uploading & submitting..." : "Submitting..."}
            </>
          ) : (
            "Submit Application"
          )}
        </button>
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          By applying, you agree that Hive BPO may store your details and resume to assess your application.
        </p>
      </div>
    </form>
  );
}
