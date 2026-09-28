"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { ResumeDropzone } from "@/components/careers/ResumeDropzone";
import { Check, CircleAlert, LoaderCircle } from "@/components/icons";
import { RESUME_REQUIRED } from "@/lib/careers";
import {
  APPLICATION_LIMITS,
  cleanApplication,
  validateApplication,
  type ApplicationField,
  type ApplicationFields,
  type FieldErrors,
} from "@/lib/validate";

type ApplyTarget = { id: string; title: string };

const LABEL = "block text-xs tracking-wider uppercase text-muted-foreground mb-2";
const FIELD =
  "w-full bg-background border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors";
const fieldClass = (invalid: boolean) =>
  FIELD + (invalid ? " border-destructive focus:border-destructive" : " border-border focus:border-accent");

const EMPTY: ApplicationFields = { applicant_name: "", applicant_email: "", phone: "", portfolio_url: "", cover_note: "" };
/** Order the fields appear in, so the first invalid one gets focus. */
const FIELD_ORDER: ApplicationField[] = ["applicant_name", "applicant_email", "phone", "portfolio_url", "resume", "cover_note"];

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

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-start gap-1.5 text-destructive text-sm mt-2">
      <CircleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      {message}
    </p>
  );
}

/**
 * Job application form. Every field is checked here with the same rules the server uses
 * (src/lib/validate.ts), instead of relying on the browser's built-in "required" popups.
 */
export function ApplicationForm({ job, onSubmitted }: { job: ApplyTarget; onSubmitted: () => void }) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState(EMPTY);
  const [resume, setResume] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors<ApplicationField>>({});
  const [touched, setTouched] = useState<Partial<Record<ApplicationField, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const ids = {
    applicant_name: `${uid}-name`,
    applicant_email: `${uid}-email`,
    phone: `${uid}-phone`,
    portfolio_url: `${uid}-portfolio`,
    resume: `${uid}-resume`,
    cover_note: `${uid}-note`,
  } satisfies Record<ApplicationField, string>;

  const checkField = (key: keyof ApplicationFields, values: ApplicationFields) =>
    validateApplication(cleanApplication(values))[key];

  const setFieldError = (key: ApplicationField, message: string | undefined) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });

  const onChange = (key: keyof ApplicationFields) => (e: { target: { value: string } }) => {
    const next = { ...form, [key]: e.target.value };
    setForm(next);
    // Re-check as they type once a field has been visited, so errors clear as soon as they're fixed.
    if (touched[key]) setFieldError(key, checkField(key, next));
  };

  const onBlur = (key: keyof ApplicationFields) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setFieldError(key, checkField(key, form));
  };

  const focusFirst = (found: FieldErrors<ApplicationField>) => {
    const first = FIELD_ORDER.find((key) => found[key]);
    if (first) formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(ids[first])}`)?.focus();
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    const values = cleanApplication(form);
    const found: FieldErrors<ApplicationField> = validateApplication(values);
    if (!resume && RESUME_REQUIRED) found.resume = "Please attach your resume.";
    else if (errors.resume && resume) found.resume = errors.resume;
    setTouched(Object.fromEntries(FIELD_ORDER.map((k) => [k, true])));
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError("Please fix the highlighted fields.");
      focusFirst(found);
      return;
    }

    const body = new FormData();
    Object.entries(values).forEach(([k, v]) => body.append(k, v));
    body.append("job_listing_id", job.id);
    body.append("company_website", (e.currentTarget.elements.namedItem("company_website") as HTMLInputElement).value);
    if (resume) body.append("resume", resume, resume.name);

    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // The server re-checks everything; show its per-field messages in the same places.
        if (json.errors && typeof json.errors === "object") {
          setErrors(json.errors);
          focusFirst(json.errors);
        }
        throw new Error(json.error || "Something went wrong. Please try again.");
      }
      setForm(EMPTY);
      setResume(null);
      setErrors({});
      setTouched({});
      onSubmitted();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const describedBy = (key: ApplicationField, hint?: string) => (errors[key] ? `${ids[key]}-error` : hint);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6" aria-label={`Apply for ${job.title}`}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={ids.applicant_name} className={LABEL}>
            Full name *
          </label>
          <input
            id={ids.applicant_name}
            name="applicant_name"
            autoComplete="name"
            placeholder="Your full name"
            maxLength={APPLICATION_LIMITS.name}
            value={form.applicant_name}
            onChange={onChange("applicant_name")}
            onBlur={onBlur("applicant_name")}
            aria-invalid={errors.applicant_name ? true : undefined}
            aria-describedby={describedBy("applicant_name")}
            className={fieldClass(!!errors.applicant_name)}
          />
          <FieldError id={`${ids.applicant_name}-error`} message={errors.applicant_name} />
        </div>
        <div>
          <label htmlFor={ids.applicant_email} className={LABEL}>
            Email *
          </label>
          <input
            id={ids.applicant_email}
            name="applicant_email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@email.com"
            maxLength={APPLICATION_LIMITS.email}
            value={form.applicant_email}
            onChange={onChange("applicant_email")}
            onBlur={onBlur("applicant_email")}
            aria-invalid={errors.applicant_email ? true : undefined}
            aria-describedby={describedBy("applicant_email")}
            className={fieldClass(!!errors.applicant_email)}
          />
          <FieldError id={`${ids.applicant_email}-error`} message={errors.applicant_email} />
        </div>
        <div>
          <label htmlFor={ids.phone} className={LABEL}>
            Phone
          </label>
          <input
            id={ids.phone}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+61 …"
            maxLength={APPLICATION_LIMITS.phone}
            value={form.phone}
            onChange={onChange("phone")}
            onBlur={onBlur("phone")}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy("phone")}
            className={fieldClass(!!errors.phone)}
          />
          <FieldError id={`${ids.phone}-error`} message={errors.phone} />
        </div>
        <div>
          <label htmlFor={ids.portfolio_url} className={LABEL}>
            LinkedIn / Portfolio
          </label>
          <input
            id={ids.portfolio_url}
            name="portfolio_url"
            inputMode="url"
            autoComplete="url"
            placeholder="linkedin.com/in/…"
            maxLength={APPLICATION_LIMITS.portfolio}
            value={form.portfolio_url}
            onChange={onChange("portfolio_url")}
            onBlur={onBlur("portfolio_url")}
            aria-invalid={errors.portfolio_url ? true : undefined}
            aria-describedby={describedBy("portfolio_url")}
            className={fieldClass(!!errors.portfolio_url)}
          />
          <FieldError id={`${ids.portfolio_url}-error`} message={errors.portfolio_url} />
        </div>
      </div>

      <ResumeDropzone
        inputId={ids.resume}
        file={resume}
        onChange={setResume}
        error={errors.resume}
        onError={(message) => setFieldError("resume", message ?? undefined)}
      />

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={ids.cover_note} className={LABEL}>
            Cover note *
          </label>
          <span id={`${ids.cover_note}-count`} className="text-xs text-muted-foreground tabular-nums">
            {form.cover_note.length}/{APPLICATION_LIMITS.noteMax}
          </span>
        </div>
        <textarea
          id={ids.cover_note}
          name="cover_note"
          rows={5}
          maxLength={APPLICATION_LIMITS.noteMax}
          placeholder="Tell us why you'd be a great fit…"
          value={form.cover_note}
          onChange={onChange("cover_note")}
          onBlur={onBlur("cover_note")}
          aria-invalid={errors.cover_note ? true : undefined}
          aria-describedby={describedBy("cover_note", `${ids.cover_note}-count`)}
          className={fieldClass(!!errors.cover_note) + " resize-none"}
        />
        <FieldError id={`${ids.cover_note}-error`} message={errors.cover_note} />
      </div>

      {/* Honeypot for bots — hidden from people and assistive tech. */}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {formError && (
        <p className="flex items-start gap-2 p-3 rounded-sm bg-destructive/10 text-destructive text-sm" role="alert">
          <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          {formError}
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
