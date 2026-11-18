import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

const sha = (value: string) => createHash("sha256").update(value).digest();

/**
 * Checks a scheduled-job request. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
 * Returns an error response to send back, or null when the caller is allowed.
 */
export function cronDenied(request: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Scheduled blog jobs are disabled: CRON_SECRET is not set." }, { status: 503 });
  const given = request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(sha(given), sha(`Bearer ${secret}`))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}
