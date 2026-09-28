import { NextResponse } from "next/server";
import { TOO_MANY, clientId, isCrossSite, isTooLarge, withinRateLimit } from "@/lib/request-guard";
import { db } from "@/lib/supabase";
import { cleanInquiry, validateInquiry } from "@/lib/validate";

const MAX_BODY_BYTES = 32 * 1024;

function fail(error: string, status = 400, errors?: Record<string, string>) {
  return NextResponse.json(errors ? { error, errors } : { error }, { status });
}

export async function POST(request: Request) {
  if (isCrossSite(request)) return fail("Forbidden", 403);
  if (isTooLarge(request, MAX_BODY_BYTES)) return fail("Your message is too long.", 413);
  if (!request.headers.get("content-type")?.includes("application/json")) return fail("Unsupported request.", 415);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Your message could not be read.");

  // Honeypot: real people never fill this hidden field. Pretend it worked.
  if (typeof body.company_website === "string" && body.company_website.trim()) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const data = cleanInquiry(body);
  const errors = validateInquiry(data);
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", 400, errors as Record<string, string>);

  if (!(await withinRateLimit("inquiry", await clientId()))) return fail(TOO_MANY, 429);

  try {
    const { error } = await db().from("inquiries").insert(data);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Inquiry insert failed:", err);
    return fail("Could not send your inquiry.", 502);
  }
}
