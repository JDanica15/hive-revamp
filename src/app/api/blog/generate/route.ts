import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { generateDraft } from "@/lib/blog-agent";
import { GEMINI_CONFIGURED } from "@/lib/gemini";
import { withinRateLimit } from "@/lib/request-guard";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
// Writing a post and drawing its cover takes a while.
export const maxDuration = 120;

const sha = (value: string) => createHash("sha256").update(value).digest();

/**
 * Scheduled trigger (see vercel.json). Vercel Cron calls this with `Authorization: Bearer <CRON_SECRET>`.
 * Without the secret (or with the wrong one) nothing runs, and the agent never publishes on its own
 * unless BLOG_AUTO_PUBLISH=true.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Blog cron is disabled: CRON_SECRET is not set." }, { status: 503 });
  const given = request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(sha(given), sha(`Bearer ${secret}`))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured || !GEMINI_CONFIGURED) {
    return NextResponse.json({ error: "Supabase or GEMINI_API_KEY is not configured." }, { status: 503 });
  }
  if (!(await withinRateLimit("blogGenerate", "site"))) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  try {
    const result = await generateDraft();
    revalidatePath("/admin", "layout");
    if (result.status === "published") {
      revalidatePath("/blog");
      revalidatePath("/sitemap.xml");
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Scheduled blog post failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
