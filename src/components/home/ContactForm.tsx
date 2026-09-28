"use client";

import { useRef, useState, type FormEvent } from "react";
import { Check, CircleAlert, LoaderCircle } from "@/components/icons";
import {
  INQUIRY_LIMITS,
  SERVICE_OPTIONS,
  cleanInquiry,
  validateInquiry,
  type FieldErrors,
  type InquiryFields,
} from "@/lib/validate";

const EMPTY: InquiryFields = { name: "", email: "", company: "", service_interest: "General Inquiry", message: "" };
const FIELD_ORDER: (keyof InquiryFields)[] = ["name", "email", "company", "service_interest", "message"];
const IDS: Record<keyof InquiryFields, string> = {
  name: "contact-name",
  email: "contact-email",
  company: "contact-company",
  service_interest: "contact-service",
  message: "contact-message",
};

const LABEL = "block text-xs tracking-wider uppercase text-muted-foreground mb-1";
const FIELD =
  "w-full bg-transparent border-b py-3 px-0 text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors";
const fieldClass = (invalid: boolean) =>
  FIELD + (invalid ? " border-destructive focus:border-destructive" : " border-border focus:border-accent");

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-start gap-1.5 text-destructive text-sm mt-2">
      <CircleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      {message}
    </p>
  );
}

/** Contact form. Fields are checked here with the same rules the server uses (src/lib/validate.ts). */
export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<keyof InquiryFields>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof InquiryFields, boolean>>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  const checkField = (key: keyof InquiryFields, values: InquiryFields) => validateInquiry(cleanInquiry(values))[key];
  const setFieldError = (key: keyof InquiryFields, message: string | undefined) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });

  const onChange = (key: keyof InquiryFields) => (e: { target: { value: string } }) => {
    const next = { ...form, [key]: e.target.value };
    setForm(next);
    if (touched[key]) setFieldError(key, checkField(key, next));
  };
  const onBlur = (key: keyof InquiryFields) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setFieldError(key, checkField(key, form));
  };
  const focusFirst = (found: FieldErrors<keyof InquiryFields>) => {
    const first = FIELD_ORDER.find((key) => found[key]);
    if (first) formRef.current?.querySelector<HTMLElement>(`#${IDS[first]}`)?.focus();
  };
  const a11y = (key: keyof InquiryFields) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${IDS[key]}-error` : undefined,
  });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const values = cleanInquiry(form);
    const found = validateInquiry(values);
    setTouched(Object.fromEntries(FIELD_ORDER.map((k) => [k, true])));
    setErrors(found);
    if (Object.keys(found).length) {
      focusFirst(found);
      return;
    }

    const honeypot = (e.currentTarget.elements.namedItem("company_website") as HTMLInputElement).value;
    setSending(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, company_website: honeypot }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.errors && typeof json.errors === "object") {
          setErrors(json.errors);
          focusFirst(json.errors);
        }
        throw new Error(res.status === 429 ? json.error : "Something went wrong. Please try again or email us directly.");
      }
      setSent(true);
      setForm(EMPTY);
      setErrors({});
      setTouched({});
    } catch (err) {
      setFormError(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again or email us directly.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20" role="status">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-accent" />
        </div>
        <h3 className="font-heading text-3xl font-medium mb-3">Thank you</h3>
        <p className="text-muted-foreground max-w-md">
          Your inquiry has been received. A member of our team will reach out within one business day.
        </p>
        <button type="button" onClick={() => setSent(false)} className="mt-8 text-accent hover:underline text-sm">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6" aria-label="Contact Hive BPO">
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor={IDS.name} className={LABEL}>
            Name *
          </label>
          <input
            id={IDS.name}
            name="name"
            autoComplete="name"
            maxLength={INQUIRY_LIMITS.name}
            value={form.name}
            onChange={onChange("name")}
            onBlur={onBlur("name")}
            {...a11y("name")}
            className={fieldClass(!!errors.name)}
            placeholder="Your full name"
          />
          <FieldError id={`${IDS.name}-error`} message={errors.name} />
        </div>
        <div>
          <label htmlFor={IDS.email} className={LABEL}>
            Email *
          </label>
          <input
            id={IDS.email}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={INQUIRY_LIMITS.email}
            value={form.email}
            onChange={onChange("email")}
            onBlur={onBlur("email")}
            {...a11y("email")}
            className={fieldClass(!!errors.email)}
            placeholder="you@company.com"
          />
          <FieldError id={`${IDS.email}-error`} message={errors.email} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor={IDS.company} className={LABEL}>
            Company
          </label>
          <input
            id={IDS.company}
            name="company"
            autoComplete="organization"
            maxLength={INQUIRY_LIMITS.company}
            value={form.company}
            onChange={onChange("company")}
            onBlur={onBlur("company")}
            {...a11y("company")}
            className={fieldClass(!!errors.company)}
            placeholder="Company name"
          />
          <FieldError id={`${IDS.company}-error`} message={errors.company} />
        </div>
        <div>
          <label htmlFor={IDS.service_interest} className={LABEL}>
            Service Interest
          </label>
          <select
            id={IDS.service_interest}
            name="service_interest"
            value={form.service_interest}
            onChange={onChange("service_interest")}
            className={fieldClass(false)}
          >
            {SERVICE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={IDS.message} className={LABEL}>
          Message *
        </label>
        <textarea
          id={IDS.message}
          name="message"
          rows={4}
          maxLength={INQUIRY_LIMITS.messageMax}
          value={form.message}
          onChange={onChange("message")}
          onBlur={onBlur("message")}
          {...a11y("message")}
          className={fieldClass(!!errors.message) + " resize-none"}
          placeholder="Tell us about your needs..."
        />
        <FieldError id={`${IDS.message}-error`} message={errors.message} />
      </div>

      {/* Honeypot for bots — hidden from people and assistive tech. */}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {formError && (
        <p className="flex items-start gap-2 text-destructive text-sm" role="alert">
          <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center gap-2 px-8 py-4 bg-foreground text-background rounded-full font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {sending ? (
          <>
            <LoaderCircle className="w-4 h-4 animate-spin" /> Sending...
          </>
        ) : (
          "Send Inquiry"
        )}
      </button>
    </form>
  );
}
