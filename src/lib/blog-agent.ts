import "server-only";
import { BLOG_BUCKET, isSlug, slugify, type BlogPost } from "@/lib/blog";
import { MIGRATION_HINT, getBlogSettings } from "@/lib/blog-settings";
import { GeminiError, IMAGE_MODEL, TEXT_MODEL, generateImage, generateJson } from "@/lib/gemini";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { db } from "@/lib/supabase";
import { clean } from "@/lib/validate";

// The blog writing agent: picks a topic, has Gemini write the post, has Gemini draw a cover image,
// uploads the image to Supabase Storage and saves everything as a DRAFT for a human to review.
// (Set BLOG_AUTO_PUBLISH=true to publish immediately instead. Not recommended: AI can invent facts.)

const AUTO_PUBLISH = process.env.BLOG_AUTO_PUBLISH === "true";

const SYSTEM = `You are the content writer for ${SITE_NAME}, a business process outsourcing (BPO) company based in Sydney, Australia, with a team in the Philippines. ${SITE_DESCRIPTION}

Write blog posts for business owners and operations managers who are considering or already using outsourced HR, bookkeeping/finance and customer-service support.

Voice: warm, clear, practical, confident but never salesy. Australian English spelling (organisation, programme only when it is a proper noun, etc). Short paragraphs. Concrete, useful advice a reader can act on.

Hard rules:
- NEVER invent statistics, studies, percentages, quotes, client names, case studies, awards or facts about ${SITE_NAME}'s size, pricing or results. Speak in general terms or use clearly hedged language ("many businesses find...").
- About ${SITE_NAME} itself, you may state ONLY what appears in the "COMPANY BRIEF" or "FACTS FOR THIS POST" sections of the request. Anything else about ${SITE_NAME} (tools used, processes, numbers, plans, clients, history) must not be stated, implied or guessed, even if it sounds plausible. If the supplied facts are thin, write a shorter post that stays inside them rather than padding with invented specifics.
- When facts are supplied, keep their meaning exactly: do not strengthen them (for example "we trial X" must not become "we rely on X").
- Do not name real people or companies except well-known, uncontroversial examples where essential.
- Do not give legal, tax or financial advice as fact; suggest checking with a qualified professional where relevant.
- No clickbait. No emojis. No filler introductions like "In today's fast-paced world".
- List in "fact_check_notes" every claim in the post that a human should verify before publishing (or write "None" if there are none).
- The "body" is simple Markdown: "## " for section headings, "### " for sub-headings, "- " bullet lists, "1. " numbered lists, **bold**, and [text](https://...) links only to well-known reputable sites. No HTML, no images, no top-level "# " title (the title is shown separately).`;

const PILLARS = [
  "outsourcing HR functions (recruitment, onboarding, compliance, performance)",
  "outsourced bookkeeping and finance operations (AP/AR, reconciliation, payroll, reporting)",
  "customer service and support quality, and how to measure it",
  "building and managing remote or offshore teams across Australia and the Philippines",
  "choosing a BPO partner and getting the first 90 days right",
  "process improvement, documentation and handover for small and mid-sized businesses",
  "workplace culture and retention in distributed teams",
];

const POST_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "Specific, plain-English headline, max 70 characters." },
    excerpt: { type: "STRING", description: "1-2 sentence summary for the blog list and search results, max 155 characters." },
    body: { type: "STRING", description: "The full article in simple Markdown, about 800-1,100 words, 4-6 sections." },
    tags: { type: "ARRAY", items: { type: "STRING" }, description: "3 to 5 short lowercase topic tags." },
    image_prompt: {
      type: "STRING",
      description:
        "A visual description for the cover image: a scene, object or abstract composition that suits the article. No text, no logos, no real or recognisable people.",
    },
    image_alt: { type: "STRING", description: "Concise alt text for the cover image, max 125 characters." },
    fact_check_notes: { type: "STRING", description: "Claims a human should verify before publishing, or 'None'." },
  },
  required: ["title", "excerpt", "body", "tags", "image_prompt", "image_alt", "fact_check_notes"],
};

type Draft = {
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  image_prompt: string;
  image_alt: string;
  fact_check_notes: string;
};

const IMAGE_STYLE =
  "Wide 16:9 editorial composition, soft natural light, warm honey-amber and cream colour palette with calm neutral tones, " +
  "modern and professional. Absolutely no text, letters, numbers, logos, watermarks or UI screenshots. " +
  "No recognisable real people; if people appear they are small, unidentifiable or seen from behind.";

export type AgentResult = { id: string; title: string; status: string; imageOk: boolean; imageError?: string };

type Topic = { id: string; topic: string; facts: string; kind: "general" | "hive" };

/**
 * Next queued topic (marked used once the post is saved), or null to let the agent choose.
 * Rotation: with hive_post_every = N, every Nth AI post is a Hive post (one written from supplied
 * facts) when a Hive topic is queued; otherwise the oldest General topic. If the preferred kind has
 * nothing queued, the other kind is used rather than letting the agent improvise.
 */
async function nextTopic(hiveEvery: number): Promise<Topic | null> {
  const { count } = await db().from("blog_posts").select("id", { count: "exact", head: true }).eq("source", "ai");
  const hiveTurn = hiveEvery > 0 && ((count ?? 0) % hiveEvery) === hiveEvery - 1;
  const oldest = async (kind: "general" | "hive") => {
    const { data, error } = await db()
      .from("blog_topics")
      .select("id, topic, facts, kind")
      .eq("status", "queued")
      .eq("kind", kind)
      .order("created_date")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Could not read the topic queue. ${MIGRATION_HINT} (${error.message})`);
    return (data as Topic | null) ?? null;
  };
  const order = hiveTurn ? (["hive", "general"] as const) : (["general", "hive"] as const);
  return (await oldest(order[0])) ?? (await oldest(order[1]));
}

async function uniqueSlug(title: string) {
  const base = slugify(title);
  for (let n = 1; n < 50; n += 1) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const { data } = await db().from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
  }
  return `${base}-${Date.now()}`;
}

/** Generates a cover image and uploads it. Returns the stored path and public URL. */
async function makeCover(prompt: string, slug: string) {
  const { bytes, mimeType } = await generateImage(`${prompt}\n\n${IMAGE_STYLE}`);
  if (bytes.length > 5 * 1024 * 1024) throw new GeminiError("The generated image was larger than 5 MB.");
  const ext = mimeType.includes("jpeg") ? "jpg" : mimeType.includes("webp") ? "webp" : "png";
  const contentType = ext === "jpg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
  const path = `${slug}-${Date.now().toString(36)}.${ext}`;
  const { error } = await db().storage.from(BLOG_BUCKET).upload(path, bytes, { contentType, upsert: false });
  if (error) throw new GeminiError(`Could not store the image: ${error.message}`);
  const { data } = db().storage.from(BLOG_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

/**
 * Writes one new post (with cover image) and saves it. `topic` / `facts` override the queue:
 * facts make it a Hive post (written only from those facts plus the company brief).
 */
export async function generateDraft(opts: { topic?: string; facts?: string } = {}): Promise<AgentResult> {
  const settings = await getBlogSettings();
  const manualTopic = clean(opts.topic, 200);
  const manualFacts = clean(opts.facts, 4000, { multiline: true });
  const queued = manualTopic || manualFacts ? null : await nextTopic(settings.hive_post_every);
  const topic = manualTopic || queued?.topic || "";
  const facts = manualFacts || queued?.facts || "";
  if (facts && !topic) throw new GeminiError("Add a topic to go with those facts.");

  const { data: recent } = await db().from("blog_posts").select("title").order("created_date", { ascending: false }).limit(25);
  const NL = "\n";
  const avoid = (recent ?? []).map((r: { title: string }) => `- ${r.title}`).join(NL);

  const brief = settings.company_brief.trim();
  const sections = [
    topic
      ? `Write a new blog post about: ${topic}`
      : `Choose a fresh, genuinely useful topic from these areas and write the post:${NL}${PILLARS.map((p) => `- ${p}`).join(NL)}`,
    brief
      ? `COMPANY BRIEF (verified facts about ${SITE_NAME}; you may state these as true):${NL}${brief}`
      : `COMPANY BRIEF: none supplied. Do not state anything specific about ${SITE_NAME}.`,
    facts
      ? `FACTS FOR THIS POST (verified by ${SITE_NAME}; this is a ${SITE_NAME} post, so build it from these and stay inside them):${NL}${facts}`
      : "",
    avoid ? `Existing posts (do not repeat these topics or titles):${NL}${avoid}` : "",
  ].filter(Boolean);

  const draft = await generateJson<Draft>({ system: SYSTEM, prompt: sections.join(NL + NL), schema: POST_SCHEMA });

  const title = clean(draft.title, 120);
  const body = clean(draft.body, 20000, { multiline: true });
  if (!title || body.length < 600) throw new GeminiError("Gemini's draft was too short to use. Try again.");

  const slug = await uniqueSlug(title);
  const imagePrompt = clean(draft.image_prompt, 600);
  let cover = { path: "", url: "" };
  let imageError: string | undefined;
  try {
    cover = await makeCover(imagePrompt || title, slug);
  } catch (err) {
    // Keep the written draft; the admin can retry the image with one click.
    imageError = err instanceof Error ? err.message : "Image generation failed.";
    console.error("Blog cover image failed:", imageError);
  }

  const status = AUTO_PUBLISH && cover.url ? "published" : "draft";
  const { data, error } = await db()
    .from("blog_posts")
    .insert({
      slug,
      title,
      excerpt: clean(draft.excerpt, 300),
      body,
      tags: (Array.isArray(draft.tags) ? draft.tags : []).map((t) => slugify(String(t)).replace(/-/g, " ")).filter(Boolean).slice(0, 5),
      cover_image_url: cover.url,
      cover_image_path: cover.path,
      cover_alt: clean(draft.image_alt, 200),
      image_prompt: imagePrompt,
      fact_check_notes: clean(draft.fact_check_notes, 2000, { multiline: true }),
      facts_used: facts,
      status,
      source: "ai",
      topic,
      model: `${TEXT_MODEL} + ${IMAGE_MODEL}`,
      published_date: status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !data) {
    if (cover.path) await db().storage.from(BLOG_BUCKET).remove([cover.path]);
    throw new Error(`Could not save the post: ${error?.message ?? "unknown error"}`);
  }
  if (queued) await db().from("blog_topics").update({ status: "used", used_date: new Date().toISOString() }).eq("id", queued.id);

  return { id: data.id as string, title, status, imageOk: Boolean(cover.url), imageError };
}

/** Generates a fresh cover for an existing post, replacing (and deleting) the old one. */
export async function regenerateCover(postId: string, promptOverride?: string) {
  const { data } = await db().from("blog_posts").select("slug, title, image_prompt, cover_image_path").eq("id", postId).maybeSingle();
  const post = data as Pick<BlogPost, "slug" | "title" | "image_prompt" | "cover_image_path"> | null;
  if (!post || !isSlug(post.slug)) throw new Error("Post not found.");
  const prompt = clean(promptOverride, 600) || post.image_prompt || post.title;
  const cover = await makeCover(prompt, post.slug);
  const { error } = await db()
    .from("blog_posts")
    .update({ cover_image_url: cover.url, cover_image_path: cover.path, image_prompt: prompt })
    .eq("id", postId);
  if (error) {
    await db().storage.from(BLOG_BUCKET).remove([cover.path]);
    throw new Error(error.message);
  }
  if (post.cover_image_path) await db().storage.from(BLOG_BUCKET).remove([post.cover_image_path]);
}
