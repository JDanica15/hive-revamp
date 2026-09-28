// Form validation shared by the browser (instant, per-field messages) and the API routes
// (the real check, since anything in the browser can be bypassed). Keep both sides on these rules.

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

// Control characters (except tab/newline) have no place in form text and can break logs or exports.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;

/** Trims, removes control/bidi characters, and caps the length of an untrusted value. */
export function clean(value: unknown, max: number, { multiline = false } = {}) {
  if (typeof value !== "string") return "";
  let text = value.replace(CONTROL_CHARS, "");
  text = multiline ? text.replace(/\r\n?/g, "\n").replace(/\n{4,}/g, "\n\n\n") : text.replace(/\s+/g, " ");
  return text.trim().slice(0, max);
}

// Letters (any language), spaces, and . ' ’ - only; must start with a letter.
const NAME_RE = /^\p{L}[\p{L}\p{M}\s.'’-]*$/u;
// Deliberately stricter than RFC 5322: no quotes, spaces, "?", "&" or other characters that could
// inject headers or parameters when the address is used in a mailto: link or an email.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]+$/;

export function isEmail(value: string) {
  return value.length <= 254 && EMAIL_RE.test(value) && !value.includes("..");
}

function nameError(value: string, label: string) {
  if (!value) return `Please enter ${label}.`;
  if (value.length < 2) return `${capitalize(label)} looks too short.`;
  if (value.length > 100) return `${capitalize(label)} must be 100 characters or fewer.`;
  if (!NAME_RE.test(value)) return `${capitalize(label)} can only contain letters, spaces, apostrophes, hyphens and full stops.`;
  return undefined;
}

function emailError(value: string) {
  if (!value) return "Please enter your email address.";
  if (!isEmail(value)) return "Please enter a valid email address, like name@example.com.";
  return undefined;
}

function phoneError(value: string) {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "").length;
  if (!PHONE_RE.test(value) || digits < 7 || digits > 15) return "Please enter a valid phone number, like +61 400 000 000.";
  return undefined;
}

/** Adds https:// when missing, e.g. "linkedin.com/in/me". Returns "" for empty input. */
export function normalizeUrl(value: string) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function urlError(value: string) {
  if (!value) return undefined;
  if (value.length > 300) return "That link is too long.";
  try {
    const url = new URL(normalizeUrl(value));
    const validHost = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname);
    if (!["http:", "https:"].includes(url.protocol) || !validHost || url.username || url.password) throw new Error();
  } catch {
    return "Please enter a valid link, like linkedin.com/in/your-name.";
  }
  return undefined;
}

function textError(value: string, { label, min, max }: { label: string; min: number; max: number }) {
  if (!value) return `Please write ${label}.`;
  if (value.length < min) return `Please write at least ${min} characters (currently ${value.length}).`;
  if (value.length > max) return `Please keep it under ${max} characters.`;
  return undefined;
}

function compact<K extends string>(errors: Record<K, string | undefined>): FieldErrors<K> {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as FieldErrors<K>;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Job applications ------------------------------------------------------------

export const APPLICATION_LIMITS = { name: 100, email: 254, phone: 30, portfolio: 300, noteMin: 20, noteMax: 3000 };

export type ApplicationFields = {
  applicant_name: string;
  applicant_email: string;
  phone: string;
  portfolio_url: string;
  cover_note: string;
};
export type ApplicationField = keyof ApplicationFields | "resume";

export function cleanApplication(input: Record<string, unknown>): ApplicationFields {
  return {
    applicant_name: clean(input.applicant_name, APPLICATION_LIMITS.name + 1),
    applicant_email: clean(input.applicant_email, APPLICATION_LIMITS.email + 1).toLowerCase(),
    phone: clean(input.phone, APPLICATION_LIMITS.phone + 1),
    portfolio_url: clean(input.portfolio_url, APPLICATION_LIMITS.portfolio + 1),
    cover_note: clean(input.cover_note, APPLICATION_LIMITS.noteMax + 1, { multiline: true }),
  };
}

export function validateApplication(f: ApplicationFields): FieldErrors<keyof ApplicationFields> {
  return compact({
    applicant_name: nameError(f.applicant_name, "your full name"),
    applicant_email: emailError(f.applicant_email),
    phone: phoneError(f.phone),
    portfolio_url: urlError(f.portfolio_url),
    cover_note: textError(f.cover_note, { label: "a short cover note", min: APPLICATION_LIMITS.noteMin, max: APPLICATION_LIMITS.noteMax }),
  });
}

// Contact inquiries -------------------------------------------------------------

export const SERVICE_OPTIONS = [
  "HR Outsourcing",
  "Bookkeeping & Finance",
  "Customer Service",
  "Admin Support",
  "Flexible Staffing",
  "General Inquiry",
] as const;

export const INQUIRY_LIMITS = { name: 100, email: 254, company: 150, messageMin: 10, messageMax: 5000 };

export type InquiryFields = { name: string; email: string; company: string; service_interest: string; message: string };

export function cleanInquiry(input: Record<string, unknown>): InquiryFields {
  const service = clean(input.service_interest, 100);
  return {
    name: clean(input.name, INQUIRY_LIMITS.name + 1),
    email: clean(input.email, INQUIRY_LIMITS.email + 1).toLowerCase(),
    company: clean(input.company, INQUIRY_LIMITS.company + 1),
    service_interest: (SERVICE_OPTIONS as readonly string[]).includes(service) ? service : "General Inquiry",
    message: clean(input.message, INQUIRY_LIMITS.messageMax + 1, { multiline: true }),
  };
}

export function validateInquiry(f: InquiryFields): FieldErrors<keyof InquiryFields> {
  return compact({
    name: nameError(f.name, "your name"),
    email: emailError(f.email),
    company: f.company.length > INQUIRY_LIMITS.company ? `Company name must be ${INQUIRY_LIMITS.company} characters or fewer.` : undefined,
    service_interest: undefined,
    message: textError(f.message, { label: "a message", min: INQUIRY_LIMITS.messageMin, max: INQUIRY_LIMITS.messageMax }),
  });
}
