import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db, isSupabaseConfigured } from "@/lib/supabase";
import { SUPABASE_SECRET_KEY } from "@/lib/supabase-env";

// Protection shared by the public form endpoints and the admin login.

/**
 * Rejects requests sent from another website's page (a browser always sends Origin on POST).
 * Requests without Origin (scripts, curl) are left to validation and rate limiting.
 */
export function isCrossSite(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

/** True when the declared body size exceeds `max` bytes (checked before reading the body). */
export function isTooLarge(request: Request, max: number) {
  const length = Number(request.headers.get("content-length") ?? 0);
  return Number.isFinite(length) && length > max;
}

/**
 * A privacy-preserving id for the visitor: a salted hash of their IP address, so rate limits
 * work without storing IPs. On Vercel, x-real-ip / x-forwarded-for are set by the platform.
 */
export async function clientId() {
  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256")
    .update(`${ip}|${SUPABASE_SECRET_KEY ?? "hive"}`)
    .digest("hex")
    .slice(0, 32);
}

export const LIMITS = {
  inquiry: { max: 5, windowSeconds: 10 * 60 },
  application: { max: 5, windowSeconds: 60 * 60 },
  login: { max: 8, windowSeconds: 15 * 60 },
  loginEmail: { max: 10, windowSeconds: 60 * 60 },
  passwordReset: { max: 3, windowSeconds: 60 * 60 },
} as const;

/**
 * Counts recent attempts for `action` + `key` and records this one. Returns false when the limit
 * is reached. Stored in the rate_limits table so it holds across serverless instances. If the
 * table is unavailable it allows the request (and logs), rather than taking the forms down.
 */
export async function withinRateLimit(action: keyof typeof LIMITS, key: string) {
  if (!isSupabaseConfigured) return true;
  const { max, windowSeconds } = LIMITS[action];
  const bucket = `${action}:${key}`;
  try {
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const { count, error } = await db()
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .gte("created_at", since);
    // A count-only query on a missing table returns no error, just a null count.
    if (error || count === null) throw error ?? new Error("rate_limits table not found");
    if (count >= max) return false;

    const { error: insertError } = await db().from("rate_limits").insert({ bucket });
    if (insertError) throw insertError;
    // Occasionally clear out entries older than a day.
    if (Math.random() < 0.02) {
      await db().from("rate_limits").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
    }
    return true;
  } catch (err) {
    console.error(`Rate limit check failed for ${action} (allowing request):`, err);
    return true;
  }
}

export const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
