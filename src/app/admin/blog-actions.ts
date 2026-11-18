"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { generateDraft, regenerateCover } from "@/lib/blog-agent";
import { MIGRATION_HINT, getBlogSettings } from "@/lib/blog-settings";
import { BLOG_BUCKET, POST_STATUSES, isSlug, slugify } from "@/lib/blog";
import { GEMINI_CONFIGURED, checkGemini } from "@/lib/gemini";
import { TOO_MANY, withinRateLimit } from "@/lib/request-guard";
import { db } from "@/lib/supabase";
import { clean } from "@/lib/validate";

// Every action re-checks the admin session: Server Actions are public endpoints.

type State = { error?: string; info?: string } | null;

function refreshBlog(slug?: string) {
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin", "layout");
}

const message = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong.");

/** "Write a post now": writes the article and saves it as a draft; the cover image follows on the review page. */
export async function generatePostNow(_prev: State, form: FormData): Promise<State> {
  await requireAdmin();
  if (!GEMINI_CONFIGURED) return { error: "GEMINI_API_KEY isn't set. Add it to your environment variables and restart." };
  if (!(await withinRateLimit("blogGenerate", "site"))) return { error: TOO_MANY };
  let id: string;
  try {
    const result = await generateDraft({ topic: String(form.get("topic") ?? ""), facts: String(form.get("facts") ?? ""), deferImage: true });
    id = result.id;
  } catch (err) {
    console.error("Blog generation failed:", err);
    return { error: message(err) };
  }
  refreshBlog();
  // The review page draws the cover image next, as its own request with its own time allowance.
  redirect(`/admin/blog/${id}?image=pending`);
}

/** Draws the cover for a post that has none. Safe to call twice: it does nothing once a cover exists. */
export async function generateCoverFor(id: string): Promise<State> {
  await requireAdmin();
  if (!GEMINI_CONFIGURED) return { error: "GEMINI_API_KEY isn't set." };
  const { data } = await db().from("blog_posts").select("slug, cover_image_url").eq("id", id).maybeSingle();
  if (!data) return { error: "Post not found." };
  if (data.cover_image_url) return { info: "The cover image is already there." };
  if (!(await withinRateLimit("blogGenerate", "site"))) return { error: TOO_MANY };
  try {
    await regenerateCover(id);
  } catch (err) {
    console.error("Cover generation failed:", err);
    return { error: message(err) };
  }
  refreshBlog(data.slug);
  return { info: "Cover image added." };
}

export async function checkGeminiConnection(): Promise<State> {
  await requireAdmin();
  if (!GEMINI_CONFIGURED) return { error: "GEMINI_API_KEY isn't set." };
  try {
    const r = await checkGemini();
    const lines = [
      `Text model "${r.textModel}": ${r.textOk ? "working ✓" : `FAILED ✗ ${r.textError}`}`,
      `Image model "${r.imageModel}": ${r.imageOk ? "listed ✓ (tested when you generate a post)" : "NOT found for this key ✗"}`,
    ];
    if (!r.textOk && r.textSuggestions.length) lines.push(`Text models you can use: ${r.textSuggestions.join(", ")} (set GEMINI_TEXT_MODEL)`);
    if (!r.imageOk && r.suggestions.length) lines.push(`Image models you can use: ${r.suggestions.join(", ")} (set GEMINI_IMAGE_MODEL)`);
    return r.textOk && r.imageOk ? { info: lines.join("\n") } : { error: lines.join("\n") };
  } catch (err) {
    return { error: message(err) };
  }
}

export async function savePost(_prev: State, form: FormData): Promise<State> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const title = clean(form.get("title"), 120);
  const body = clean(form.get("body"), 20000, { multiline: true });
  const slug = slugify(clean(form.get("slug"), 100) || title);
  const status = String(form.get("status") ?? "draft");
  if (!title || !body) return { error: "A title and body are required." };
  if (!isSlug(slug)) return { error: "That URL slug isn't valid." };
  if (!(POST_STATUSES as readonly string[]).includes(status)) return { error: "Invalid status." };

  const { data: current } = await db().from("blog_posts").select("slug, status, published_date, cover_image_url").eq("id", id).maybeSingle();
  if (!current) return { error: "Post not found." };
  if (status === "published" && !current.cover_image_url) return { error: "Add a cover image before publishing (use “Regenerate image”)." };

  const tags = clean(form.get("tags"), 200)
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
  const { error } = await db()
    .from("blog_posts")
    .update({
      title,
      slug,
      excerpt: clean(form.get("excerpt"), 300),
      body,
      tags,
      cover_alt: clean(form.get("cover_alt"), 200),
      status,
      published_date: status === "published" ? (current.published_date ?? new Date().toISOString()) : current.published_date,
    })
    .eq("id", id);
  if (error) return { error: error.code === "23505" ? "Another post already uses that URL slug." : error.message };
  refreshBlog(current.slug);
  refreshBlog(slug);
  return { info: status === "published" ? "Saved. This post is live on the site." : "Saved." };
}

export async function setPostStatus(id: string, status: string) {
  await requireAdmin();
  if (!(POST_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid status");
  const { data } = await db().from("blog_posts").select("slug, published_date, cover_image_url").eq("id", id).maybeSingle();
  if (!data) throw new Error("Post not found");
  if (status === "published" && !data.cover_image_url) throw new Error("Add a cover image before publishing.");
  const { error } = await db()
    .from("blog_posts")
    .update({ status, published_date: status === "published" ? (data.published_date ?? new Date().toISOString()) : data.published_date })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refreshBlog(data.slug);
}

export async function deletePost(id: string) {
  await requireAdmin();
  const { data } = await db().from("blog_posts").select("slug, cover_image_path").eq("id", id).maybeSingle();
  const { error } = await db().from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (data?.cover_image_path) await db().storage.from(BLOG_BUCKET).remove([data.cover_image_path]);
  refreshBlog(data?.slug);
}

export async function regeneratePostImage(_prev: State, form: FormData): Promise<State> {
  await requireAdmin();
  if (!GEMINI_CONFIGURED) return { error: "GEMINI_API_KEY isn't set." };
  if (!(await withinRateLimit("blogGenerate", "site"))) return { error: TOO_MANY };
  const id = String(form.get("id") ?? "");
  try {
    await regenerateCover(id, String(form.get("image_prompt") ?? ""));
  } catch (err) {
    console.error("Cover regeneration failed:", err);
    return { error: message(err) };
  }
  const { data } = await db().from("blog_posts").select("slug").eq("id", id).maybeSingle();
  refreshBlog(data?.slug);
  return { info: "New cover image generated." };
}

/** Queues a topic. A Hive topic must come with facts (or a company brief to draw on). */
export async function addTopic(_prev: State, form: FormData): Promise<State> {
  await requireAdmin();
  const topic = clean(form.get("topic"), 200);
  const facts = clean(form.get("facts"), 4000, { multiline: true });
  const kind = String(form.get("kind")) === "hive" ? "hive" : "general";
  if (!topic) return { error: "Enter a topic." };
  if (kind === "hive" && !facts) {
    let hasBrief = false;
    try {
      hasBrief = Boolean((await getBlogSettings()).company_brief.trim());
    } catch (err) {
      return { error: message(err) };
    }
    if (!hasBrief) return { error: "A Hive topic needs facts about Hive: add some below, or fill in the company brief first." };
  }
  const { error } = await db().from("blog_topics").insert({ topic, facts, kind });
  if (error) return { error: error.message.includes("column") ? `Couldn't save. ${MIGRATION_HINT}` : error.message };
  revalidatePath("/admin/blog");
  return { info: "Added to the queue." };
}

/** Saves the company brief (facts about Hive the writer may state) and the Hive-post rotation. */
export async function saveBlogSettings(_prev: State, form: FormData): Promise<State> {
  await requireAdmin();
  const brief = clean(form.get("company_brief"), 6000, { multiline: true });
  const every = Number(form.get("hive_post_every"));
  if (!Number.isInteger(every) || every < 0 || every > 20) return { error: "Choose a valid rotation." };
  const { error } = await db().from("blog_settings").upsert({ id: 1, company_brief: brief, hive_post_every: every, updated_date: new Date().toISOString() });
  if (error) return { error: error.message.includes("blog_settings") ? `Couldn't save. ${MIGRATION_HINT}` : error.message };
  revalidatePath("/admin/blog");
  return { info: "Saved." };
}

export async function removeTopic(id: string) {
  await requireAdmin();
  const { error } = await db().from("blog_topics").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/blog");
}
