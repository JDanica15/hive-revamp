import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { generateDraft } from "@/lib/blog-agent";
import { cronDenied } from "@/lib/cron-auth";
import { GEMINI_CONFIGURED } from "@/lib/gemini";
import { withinRateLimit } from "@/lib/request-guard";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Scheduled step 1 (see vercel.json): writes the article and saves it as a draft. The cover image
 * is drawn by step 2 (/api/blog/images) a few minutes later, so neither run can time out the other.
 * Nothing is published unless BLOG_AUTO_PUBLISH=true (and then only once the cover exists).
 */
export async function GET(request: Request) {
  const denied = cronDenied(request);
  if (denied) return denied;
  if (!isSupabaseConfigured || !GEMINI_CONFIGURED) {
    return NextResponse.json({ error: "Supabase or GEMINI_API_KEY is not configured." }, { status: 503 });
  }
  if (!(await withinRateLimit("blogGenerate", "site"))) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  try {
    const result = await generateDraft({ deferImage: true });
    revalidatePath("/admin", "layout");
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Scheduled blog post failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
