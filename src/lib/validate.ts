const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Picks the allowed string fields from an untrusted body, trimmed and length-limited. */
export function pickFields(body: unknown, fields: Record<string, number>) {
  const src = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [key, max] of Object.entries(fields)) {
    const value = src[key];
    out[key] = typeof value === "string" ? value.trim().slice(0, max) : "";
  }
  return out;
}

export function isEmail(value: string) {
  return EMAIL_RE.test(value);
}
