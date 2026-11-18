import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { fillMissingCover } from "@/lib/blog-agent";
import { cronDenied } from "@/lib/cron-auth";
import { GEMINI_CONFIGURED } from "@/lib/gemini";
import { withinRateLimit } from "@/lib/request-guard";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Scheduled step 2 (see vercel.json): draws the cover for the newest AI draft that has none. */
export async function GET(request: Request) {
  const denied = cronDenied(request);
  if (denied) return denied;
  if (!isSupabaseConfigured || !GEMINI_CONFIGURED) {
    return NextResponse.json({ error: "Supabase or GEMINI_API_KEY is not configured." }, { status: 503 });
  }
  if (!(await withinRateLimit("blogGenerate", "site"))) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  try {
    const result = await fillMissingCover();
    revalidatePath("/admin", "layout");
    if (result.published) {
      revalidatePath("/blog");
      revalidatePath("/sitemap.xml");
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Scheduled blog cover failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
