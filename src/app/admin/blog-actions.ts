"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { regenerateCover } from "@/lib/blog-agent";
import { parseLinkSuggestions } from "@/lib/blog-sections";
import { buildSeo, buildStrategy, createPostFromPlan, rewriteSection, type Brief, type Seo, type Strategy } from "@/lib/blog-studio";
import { MIGRATION_HINT, getBlogSettings } from "@/lib/blog-settings";
import { BLOG_BUCKET, POST_STATUSES, isSlug, slugify } from "@/lib/blog";
import { GEMINI_CONFIGURED, IMAGES_ENABLED, checkGemini } from "@/lib/gemini";
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

type Input<T> = Partial<Record<keyof T, unknown>>;

/** Gate for every Gemini step: admin only, key present, and the site-wide spending cap. */
async function gate(): Promise<string | null> {
  await requireAdmin();
  if (!GEMINI_CONFIGURED) return "GEMINI_API_KEY isn't set. Add it to your environment variables and restart.";
  if (!(await withinRateLimit("blogGenerate", "site"))) return TOO_MANY;
  return null;
}

/** Wizard step 1 to 2: turns the brief into a plan the editor can change. Nothing is saved yet. */
export async function createStrategy(input: Input<Brief>): Promise<{ error?: string; brief?: Brief; strategy?: Strategy }> {
  const blocked = await gate();
  if (blocked) return { error: blocked };
  try {
    return await buildStrategy(input);
  } catch (err) {
    console.error("Blog strategy failed:", err);
    return { error: message(err) };
  }
}

/** Wizard step 2 to review: writes the article and SEO from the approved plan and saves a draft. */
export async function createArticle(brief: Input<Brief>, strategy: Input<Strategy>): Promise<{ error?: string; id?: string; seoError?: string }> {
  const blocked = await gate();
  if (blocked) return { error: blocked };
  try {
    const { id, seoError } = await createPostFromPlan(brief, strategy);
    refreshBlog();
    return { id, seoError };
  } catch (err) {
    console.error("Blog article failed:", err);
    const text = message(err);
    return { error: /column|schema cache/i.test(text) ? `${text} ${MIGRATION_HINT}` : text };
  }
}

/** Review page: SEO suggestions for what is in the editor right now (nothing is saved until the editor saves). */
export async function suggestSeo(input: { title: string; body: string; keywords?: string }): Promise<{ error?: string; seo?: Seo }> {
  const blocked = await gate();
  if (blocked) return { error: blocked };
  try {
    return { seo: await buildSeo(input) };
  } catch (err) {
    console.error("Blog SEO failed:", err);
    return { error: message(err) };
  }
}

/** Review page: rewrites one section of the article in the editor (returns the new text; the editor saves it). */
export async function rewritePostSection(input: { title: string; body: string; index: number; instruction?: string }): Promise<{ error?: string; body?: string }> {
  const blocked = await gate();
  if (blocked) return { error: blocked };
  try {
    const { body } = await rewriteSection({ ...input, index: Number.isInteger(input.index) ? input.index : -1 });
    return { body };
  } catch (err) {
    console.error("Blog section rewrite failed:", err);
    return { error: message(err) };
  }
}

/** Draws the cover for a post that has none. Safe to call twice: it does nothing once a cover exists. */
export async function generateCoverFor(id: string): Promise<State> {
  await requireAdmin();
  if (!IMAGES_ENABLED) return { info: "Cover images are switched off." };
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
    const results = await checkGemini();
    const lines = results.map(
      (r) => `${r.ok ? "✓" : "✗"} ${r.kind === "text" ? "Text" : "Image"} · ${r.model} · ${r.seconds.toFixed(1)}s${r.ok ? "" : ` · ${r.note}`}`,
    );
    const textOk = results.some((r) => r.kind === "text" && r.ok);
    const imageOk = !IMAGES_ENABLED || results.some((r) => r.kind === "image" && r.ok);
    if (!textOk) lines.push("No text model is working right now. Wait a few minutes and check again, or set GEMINI_TEXT_MODELS.");
    else if (!imageOk) lines.push("Articles will work, but cover images won't until the image model above works (see its message).");
    else lines.push("Everything needed is working.");
    return textOk && imageOk ? { info: lines.join("\n") } : { error: lines.join("\n") };
  } catch (err) {
    return { error: message(err) };
  }
}

const COVER_MAX = 4 * 1024 * 1024;

/** Identifies an uploaded image by its first bytes (the filename and declared type are user-controlled). */
function sniffImage(b: Buffer): { ext: string; type: string } | null {
  if (b.length > 12 && b[0] === 0x89 && b.toString("latin1", 1, 4) === "PNG") return { ext: "png", type: "image/png" };
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b.length > 12 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") return { ext: "webp", type: "image/webp" };
  return null;
}

export async function savePost(_prev: State, form: FormData): Promise<State> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const title = clean(form.get("title"), 120);
  const body = clean(form.get("body"), 20000, { multiline: true });
  const slug = slugify(clean(form.get("slug"), 100) || title);
  const mode = String(form.get("publish_mode") ?? "draft");
  if (!["draft", "publish", "schedule", "rejected"].includes(mode)) return { error: "Invalid publishing choice." };
  if (!title || !body) return { error: "A title and body are required." };
  if (!isSlug(slug)) return { error: "That URL slug isn't valid." };

  const { data: current } = await db().from("blog_posts").select("slug, status, published_date, cover_image_url, cover_image_path").eq("id", id).maybeSingle();
  if (!current) return { error: "Post not found." };
  const now = new Date();
  const alreadyLive = current.published_date && new Date(current.published_date) <= now ? (current.published_date as string) : null;
  let status: string;
  let publishedDate: string | null;
  if (mode === "schedule") {
    const at = new Date(String(form.get("publish_at") ?? ""));
    if (Number.isNaN(at.getTime())) return { error: "Pick a date and time to schedule the post." };
    if (at.getTime() < now.getTime() - 60_000) return { error: "That time has already passed. Pick a future time, or choose “Publish now”." };
    status = "published";
    publishedDate = at.toISOString();
  } else if (mode === "publish") {
    status = "published";
    publishedDate = alreadyLive ?? now.toISOString();
  } else {
    status = mode === "rejected" ? "rejected" : "draft";
    publishedDate = alreadyLive; // keep the date of a post that was live before; drop a future (scheduled) date
  }
  if (status === "published" && IMAGES_ENABLED && !current.cover_image_url) return { error: "Add a cover image before publishing (use “Regenerate image”)." };

  // Optional cover: upload a new one, or tick "remove". Checked before anything is saved.
  let cover: { cover_image_url: string; cover_image_path: string } | null = null;
  const file = form.get("cover_file");
  if (file instanceof File && file.size > 0) {
    if (file.size > COVER_MAX) return { error: "That image is larger than 4 MB. Please use a smaller one." };
    const bytes = Buffer.from(await file.arrayBuffer());
    const kind = sniffImage(bytes);
    if (!kind) return { error: "The cover must be a PNG, JPG or WebP image." };
    const path = `${slug}-${Date.now().toString(36)}.${kind.ext}`;
    const { error: upErr } = await db().storage.from(BLOG_BUCKET).upload(path, bytes, { contentType: kind.type, upsert: false });
    if (upErr) return { error: `Could not store the image: ${upErr.message}` };
    cover = { cover_image_url: db().storage.from(BLOG_BUCKET).getPublicUrl(path).data.publicUrl, cover_image_path: path };
  } else if (form.get("remove_cover") === "on") {
    cover = { cover_image_url: "", cover_image_path: "" };
  }

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
      meta_title: clean(form.get("meta_title"), 70),
      meta_description: clean(form.get("meta_description"), 170),
      focus_keyword: clean(form.get("focus_keyword"), 60).toLowerCase(),
      link_suggestions: parseLinkSuggestions(form.get("link_suggestions")),
      ...(cover ?? {}),
      status,
      published_date: publishedDate,
    })
    .eq("id", id);
  if (error) {
    if (cover?.cover_image_path) await db().storage.from(BLOG_BUCKET).remove([cover.cover_image_path]);
    if (error.code === "23505") return { error: "Another post already uses that URL slug." };
    return { error: /column|schema cache/i.test(error.message) ? `${error.message} ${MIGRATION_HINT}` : error.message };
  }
  if (cover && current.cover_image_path) await db().storage.from(BLOG_BUCKET).remove([current.cover_image_path]);
  refreshBlog(current.slug);
  refreshBlog(slug);
  if (mode === "schedule") return { info: "Saved. This post is scheduled and goes live at the time you chose (within about 5 minutes of it)." };
  return { info: status === "published" ? "Saved. This post is live on the site." : "Saved." };
}

export async function setPostStatus(id: string, status: string) {
  await requireAdmin();
  if (!(POST_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid status");
  const { data } = await db().from("blog_posts").select("slug, published_date, cover_image_url").eq("id", id).maybeSingle();
  if (!data) throw new Error("Post not found");
  if (status === "published" && IMAGES_ENABLED && !data.cover_image_url) throw new Error("Add a cover image before publishing.");
  const wasLive = Boolean(data.published_date && new Date(data.published_date) <= new Date());
  const { error } = await db()
    .from("blog_posts")
    .update({
      status,
      // Keep the date of a post that was already live; a future (scheduled) date is dropped or replaced by now.
      published_date: wasLive ? data.published_date : status === "published" ? new Date().toISOString() : null,
    })
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
  if (!IMAGES_ENABLED) return { error: "Cover images are switched off." };
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
