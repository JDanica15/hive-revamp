import "server-only";
import { POST_SCHEMA, SYSTEM, uniqueSlug, writerContext } from "@/lib/blog-agent";
import { INTERNAL_PAGES, parseLinkSuggestions, replacePart, splitParts, type LinkSuggestion } from "@/lib/blog-sections";
import { slugify } from "@/lib/blog";
import { GeminiError, generateJson } from "@/lib/gemini";
import { SITE_NAME } from "@/lib/site";
import { db } from "@/lib/supabase";
import { clean } from "@/lib/validate";

// The step-by-step writing flow: brief -> strategy -> article -> SEO. Each step is one Gemini call so
// the editor can check and change the plan before any article is written.

const NL = String.fromCharCode(10);

export const OBJECTIVES = ["Educate readers", "Build trust and credibility", "Generate enquiries", "Announce or explain something new"] as const;
export const TONES = ["Warm and practical", "Professional and polished", "Friendly and conversational", "Authoritative and direct"] as const;

export type Brief = { topic: string; audience: string; objective: string; keywords: string; tone: string; facts: string };
export type Strategy = { title: string; search_intent: string; talking_points: string[]; structure: string[]; keywords: string[] };
export type Seo = { meta_title: string; meta_description: string; focus_keyword: string; slug: string; link_suggestions: LinkSuggestion[] };

const list = (value: unknown, maxItems: number, maxLen: number) =>
  (Array.isArray(value) ? value : [])
    .map((v) => clean(typeof v === "string" ? v : "", maxLen))
    .filter(Boolean)
    .slice(0, maxItems);

/** Server-side cleaning of anything that came from the browser. */
export function cleanBrief(input: Partial<Record<keyof Brief, unknown>>): Brief {
  const pick = (value: unknown, allowed: readonly string[], fallback: string) => {
    const v = clean(value, 80);
    return allowed.includes(v) ? v : fallback;
  };
  return {
    topic: clean(input.topic, 200),
    audience: clean(input.audience, 200) || "Business owners and operations managers",
    objective: pick(input.objective, OBJECTIVES, OBJECTIVES[0]),
    keywords: clean(input.keywords, 200),
    tone: pick(input.tone, TONES, TONES[0]),
    facts: clean(input.facts, 4000, { multiline: true }),
  };
}

export function cleanStrategy(input: Partial<Record<keyof Strategy, unknown>>): Strategy {
  return {
    title: clean(input.title, 120),
    search_intent: clean(input.search_intent, 300),
    talking_points: list(input.talking_points, 8, 240),
    structure: list(input.structure, 8, 120),
    keywords: list(input.keywords, 10, 60),
  };
}

function briefBlock(brief: Brief, company: string, avoid?: string) {
  return [
    "BRIEF FROM THE EDITOR:",
    `- Topic: ${brief.topic}`,
    `- Target audience: ${brief.audience}`,
    `- Objective: ${brief.objective}`,
    `- Keywords to work in (may be empty): ${brief.keywords || "none given"}`,
    `- Tone of voice: ${brief.tone}`,
    company ? `${NL}COMPANY BRIEF (verified facts about ${SITE_NAME}; you may state these as true):${NL}${company}` : `${NL}COMPANY BRIEF: none supplied. Do not state anything specific about ${SITE_NAME}.`,
    brief.facts ? `${NL}FACTS FOR THIS POST (verified by ${SITE_NAME}; build from these and stay inside them):${NL}${brief.facts}` : "",
    avoid ? `${NL}Existing posts (do not repeat these topics or titles):${NL}${avoid}` : "",
  ]
    .filter(Boolean)
    .join(NL);
}

const STRATEGY_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "Suggested blog title: specific, plain English, max 70 characters." },
    search_intent: { type: "STRING", description: "One sentence: what a reader searching for this topic wants to find out or do." },
    talking_points: { type: "ARRAY", items: { type: "STRING" }, description: "4 to 6 key points the article must cover, each one short sentence." },
    structure: { type: "ARRAY", items: { type: "STRING" }, description: "4 to 6 section headings in reading order. Headings only, no numbering." },
    keywords: { type: "ARRAY", items: { type: "STRING" }, description: "4 to 8 SEO keyword phrases, the main one first." },
  },
  required: ["title", "search_intent", "talking_points", "structure", "keywords"],
};

/** Step 2: the plan. Nothing is written yet, so the editor can correct the direction cheaply. */
export async function buildStrategy(briefInput: Partial<Record<keyof Brief, unknown>>) {
  const brief = cleanBrief(briefInput);
  if (!brief.topic) throw new GeminiError("Add a topic or working title first.");
  const ctx = await writerContext();
  const { value } = await generateJson<Strategy>({
    system: SYSTEM,
    prompt: [
      "Plan a blog post. Do NOT write the article yet.",
      briefBlock(brief, ctx.brief, ctx.avoid),
      "Return the suggested title, the search intent, the key talking points, the recommended section structure and SEO keyword suggestions.",
      "Keep the editor's keywords if they were given (you may add related ones). Do not plan claims you could only support with invented statistics or invented facts about " + SITE_NAME + ".",
    ].join(NL + NL),
    schema: STRATEGY_SCHEMA,
    temperature: 0.7,
    budgetMs: 60_000,
  });
  const strategy = cleanStrategy(value);
  if (!strategy.title || strategy.structure.length < 2) throw new GeminiError("Gemini's plan was incomplete. Try again.");
  return { brief, strategy };
}

const ARTICLE_SCHEMA = {
  ...POST_SCHEMA,
  properties: {
    ...POST_SCHEMA.properties,
    body: { type: "STRING", description: "The full article in simple Markdown, about 800-1000 words: short introduction, then one ## section per planned heading, a conclusion section, and a closing call to action." },
  },
};
type ArticleResult = {
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  image_prompt: string;
  image_alt: string;
  fact_check_notes: string;
};

/** Step 3: the article, written from the approved plan. */
export async function writeArticle(brief: Brief, strategy: Strategy, budgetMs: number) {
  const ctx = await writerContext();
  const { value, model } = await generateJson<ArticleResult>({
    system: SYSTEM,
    prompt: [
      "Write the full blog post from this approved plan.",
      briefBlock(brief, ctx.brief, ctx.avoid),
      [
        "APPROVED PLAN:",
        `- Title: ${strategy.title}`,
        `- Search intent: ${strategy.search_intent}`,
        `- Key talking points:${NL}${strategy.talking_points.map((p) => `  * ${p}`).join(NL)}`,
        `- Section headings, in order:${NL}${strategy.structure.map((h, i) => `  ${i + 1}. ${h}`).join(NL)}`,
        `- SEO keywords: ${strategy.keywords.join(", ")}`,
      ].join(NL),
      [
        "Structure: a short introduction with no heading (the main keyword appears naturally in it), then one '## ' section per planned heading in that order, then a '## ' conclusion section, and end with a one-paragraph call to action that fits the objective.",
        `The call to action must be a plain invitation only (for example "Get in touch with the ${SITE_NAME} team to talk it through."). It must contain NO descriptions or claims about ${SITE_NAME}: no "we specialise in", no experience, no results, no promises. Only facts from the brief may be mentioned.`,
        "Use the keywords naturally; never stuff them. Write in the requested tone for the stated audience.",
      ].join(NL),
    ].join(NL + NL),
    schema: ARTICLE_SCHEMA,
    budgetMs,
  });
  const title = clean(value.title, 120) || strategy.title;
  const body = clean(value.body, 20000, { multiline: true });
  if (body.length < 600) throw new GeminiError("Gemini's draft was too short to use. Try again.");
  return {
    model,
    title,
    excerpt: clean(value.excerpt, 300),
    body,
    tags: (Array.isArray(value.tags) ? value.tags : []).map((t) => slugify(String(t)).replace(/-/g, " ")).filter(Boolean).slice(0, 5),
    image_prompt: clean(value.image_prompt, 600),
    image_alt: clean(value.image_alt, 200),
    fact_check_notes: clean(value.fact_check_notes, 2000, { multiline: true }),
  };
}

const SEO_SCHEMA = {
  type: "OBJECT",
  properties: {
    meta_title: { type: "STRING", description: "Search result title, max 60 characters, includes the focus keyword near the start." },
    meta_description: { type: "STRING", description: "Search result description, 120-155 characters, active voice, no quotation marks." },
    focus_keyword: { type: "STRING", description: "The 2-4 word phrase this article should rank for, lowercase." },
    slug: { type: "STRING", description: "Short URL slug: lowercase words separated by hyphens, 3-6 words." },
    link_suggestions: {
      type: "ARRAY",
      description: "Up to 4 internal links worth adding to the article.",
      items: {
        type: "OBJECT",
        properties: {
          path: { type: "STRING", description: "Exactly one of the allowed page paths." },
          anchor: { type: "STRING", description: "An exact 2-5 word phrase copied from the article body, to turn into the link." },
          reason: { type: "STRING", description: "Why this link helps the reader, one short sentence." },
        },
        required: ["path", "anchor", "reason"],
      },
    },
  },
  required: ["meta_title", "meta_description", "focus_keyword", "slug", "link_suggestions"],
};

/** Step 4: search-engine fields, and internal links chosen only from the site's real pages. */
export async function buildSeo(input: { title: string; body: string; keywords?: string }, budgetMs = 40_000): Promise<Seo> {
  const title = clean(input.title, 120);
  const body = clean(input.body, 20000, { multiline: true });
  if (!title || !body) throw new GeminiError("Write the title and article first.");
  const { value } = await generateJson<Seo>({
    system: SYSTEM,
    prompt: [
      "Prepare this finished article for search engines.",
      `Title: ${title}`,
      clean(input.keywords, 300) ? `Keywords the editor wants: ${clean(input.keywords, 300)}` : "",
      `ALLOWED INTERNAL PAGES (suggest links ONLY to these paths):${NL}${INTERNAL_PAGES.map((p) => `- ${p.path}: ${p.label}`).join(NL)}`,
      `ARTICLE:${NL}${body.slice(0, 14000)}`,
      "Each link anchor must be a phrase that already appears word for word in the article. Skip a page rather than force a link that doesn't fit.",
    ]
      .filter(Boolean)
      .join(NL + NL),
    schema: SEO_SCHEMA,
    temperature: 0.4,
    budgetMs,
  });
  return {
    meta_title: clean(value.meta_title, 70),
    meta_description: clean(value.meta_description, 170),
    focus_keyword: clean(value.focus_keyword, 60).toLowerCase(),
    slug: slugify(clean(value.slug, 100)),
    // Only real pages, and only phrases that really are in the article.
    link_suggestions: parseLinkSuggestions(value.link_suggestions).filter((l) => body.includes(l.anchor)),
  };
}

const SECTION_SCHEMA = {
  type: "OBJECT",
  properties: { section: { type: "STRING", description: "The rewritten section as Markdown, starting with its '## ' heading (the introduction has no heading)." } },
  required: ["section"],
};

/** Rewrites one section of an article. `index` is the position in splitParts (0 = introduction). */
export async function rewriteSection(input: { title: string; body: string; index: number; instruction?: string }) {
  const title = clean(input.title, 120);
  const body = clean(input.body, 20000, { multiline: true });
  const parts = splitParts(body);
  const part = parts[input.index];
  if (!part || !part.text) throw new GeminiError("That section wasn't found. Save or reload the article and try again.");
  const instruction = clean(input.instruction, 400);
  const ctx = await writerContext();
  const { value } = await generateJson<{ section: string }>({
    system: SYSTEM,
    prompt: [
      `Rewrite ONE section of the blog post "${title}". Everything else stays as it is.`,
      ctx.brief ? `COMPANY BRIEF (verified facts about ${SITE_NAME}):${NL}${ctx.brief}` : `COMPANY BRIEF: none supplied. Do not state anything specific about ${SITE_NAME}.`,
      `FULL ARTICLE, for context:${NL}${body}`,
      `SECTION TO REWRITE (${part.isIntro ? "the introduction" : `"${part.heading}"`}):${NL}${part.text}`,
      instruction ? `EDITOR'S INSTRUCTION: ${instruction}` : "No special instruction: write a fresher, clearer, more useful version of this section.",
      part.isIntro
        ? "Return only the new introduction: no heading."
        : "Return only the new section, starting with a '## ' heading (keep the heading unless the instruction asks to change it). Do not repeat points made in other sections.",
      `Keep the same voice and facts-only rules. Do not add statistics or facts about ${SITE_NAME} that aren't supplied.`,
    ].join(NL + NL),
    schema: SECTION_SCHEMA,
    budgetMs: 60_000,
  });
  let text = clean(value.section, 6000, { multiline: true });
  if (text.length < 60) throw new GeminiError("Gemini's rewrite was too short to use. Try again.");
  if (!part.isIntro) {
    text = text.replace(/^#\s+/, "## ");
    if (!/^##\s+\S/.test(text)) text = `## ${part.heading}${NL}${NL}${text}`;
  } else {
    text = text.replace(/^#{1,6}\s+.*\n+/, "");
  }
  return { body: replacePart(body, input.index, text), part: text };
}

/**
 * Steps 3 and 4 together, then saves a draft. If the SEO step fails the article is still saved and the
 * editor can run SEO again from the review page, so a slow model never loses the article.
 */
export async function createPostFromPlan(briefInput: Partial<Record<keyof Brief, unknown>>, strategyInput: Partial<Record<keyof Strategy, unknown>>) {
  const brief = cleanBrief(briefInput);
  const strategy = cleanStrategy(strategyInput);
  if (!brief.topic || !strategy.title || strategy.structure.length < 2) throw new GeminiError("The plan is missing a title or section headings.");

  const started = Date.now();
  const article = await writeArticle(brief, strategy, 85_000);
  let seo: Seo | null = null;
  let seoError = "";
  const left = 110_000 - (Date.now() - started);
  if (left > 12_000) {
    try {
      seo = await buildSeo({ title: article.title, body: article.body, keywords: strategy.keywords.join(", ") }, Math.min(left, 25_000));
    } catch (err) {
      seoError = err instanceof Error ? err.message : "SEO step failed.";
      console.error("Blog SEO step failed:", seoError);
    }
  }

  const slug = await uniqueSlug(seo?.slug || article.title);
  const { data, error } = await db()
    .from("blog_posts")
    .insert({
      slug,
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
      tags: article.tags,
      cover_alt: article.image_alt,
      image_prompt: article.image_prompt,
      fact_check_notes: article.fact_check_notes,
      facts_used: brief.facts,
      meta_title: seo?.meta_title ?? "",
      meta_description: seo?.meta_description ?? "",
      focus_keyword: seo?.focus_keyword ?? strategy.keywords[0]?.toLowerCase() ?? "",
      link_suggestions: seo?.link_suggestions ?? [],
      brief,
      strategy,
      status: "draft",
      source: "ai",
      topic: brief.topic,
      model: article.model,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Could not save the post: ${error?.message ?? "unknown error"}`);
  return { id: data.id as string, seoError };
}
