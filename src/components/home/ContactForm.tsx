"use client";

import { useState, type FormEvent } from "react";
import { Check, LoaderCircle } from "@/components/icons";

const SERVICE_OPTIONS = [
  "HR Outsourcing",
  "Bookkeeping & Finance",
  "Customer Service",
  "Admin Support",
  "Flexible Staffing",
  "General Inquiry",
];

const EMPTY = { name: "", email: "", company: "", service_interest: "General Inquiry", message: "" };

const LABEL = "block text-xs tracking-wider uppercase text-muted-foreground mb-1";
const FIELD =
  "w-full bg-transparent border-b border-border py-3 px-0 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors";

export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setSent(true);
      setForm(EMPTY);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
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
    <form onSubmit={onSubmit} className="space-y-6" aria-label="Contact Hive BPO">
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contact-name" className={LABEL}>
            Name *
          </label>
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={FIELD}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={LABEL}>
            Email *
          </label>
          <input
            id="contact-email"
            name="email"
            autoComplete="email"
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={FIELD}
            placeholder="you@company.com"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contact-company" className={LABEL}>
            Company
          </label>
          <input
            id="contact-company"
            name="company"
            autoComplete="organization"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className={FIELD}
            placeholder="Company name"
          />
        </div>
        <div>
          <label htmlFor="contact-service" className={LABEL}>
            Service Interest
          </label>
          <select
            id="contact-service"
            name="service_interest"
            value={form.service_interest}
            onChange={(e) => setForm({ ...form, service_interest: e.target.value })}
            className={FIELD}
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
        <label htmlFor="contact-message" className={LABEL}>
          Message *
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={4}
          className="w-full bg-transparent border-b border-border py-3 px-0 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors resize-none"
          placeholder="Tell us about your needs..."
        />
      </div>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
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
