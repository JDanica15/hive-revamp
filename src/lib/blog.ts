// Blog types and reading helpers. Published posts are read on the server with the secret key
// (the tables have no public policies), so drafts can never leak through the public API key.
import "server-only";
import { db, isSupabaseConfigured } from "@/lib/supabase";

export const POST_STATUSES = ["draft", "published", "rejected"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  cover_image_url: string;
  cover_image_path: string;
  cover_alt: string;
  image_prompt: string;
  fact_check_notes: string;
  facts_used: string;
  status: PostStatus;
  source: "manual" | "ai";
  topic: string;
  model: string;
  published_date: string | null;
  created_date: string;
  updated_date: string;
};

export const BLOG_BUCKET = "blog-images";

/** "Why Offshore Teams Work!" → "why-offshore-teams-work" */
export function slugify(text: string) {
  return (
    text
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/g, "") || "post"
  );
}

export function isSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 100;
}

const PUBLIC_FIELDS = "id, slug, title, excerpt, body, tags, cover_image_url, cover_alt, published_date, updated_date, created_date";

/** Published posts, newest first. Returns [] if Supabase isn't configured or the blog tables aren't installed yet. */
export async function getPublishedPosts(limit = 50): Promise<BlogPost[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await db()
    .from("blog_posts")
    .select(PUBLIC_FIELDS)
    .eq("status", "published")
    .lte("published_date", new Date().toISOString())
    .order("published_date", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Could not load blog posts:", error.message);
    return [];
  }
  return data as unknown as BlogPost[];
}

export async function getPublishedPost(slug: string): Promise<BlogPost | undefined> {
  if (!isSupabaseConfigured || !isSlug(slug)) return undefined;
  const { data, error } = await db()
    .from("blog_posts")
    .select(PUBLIC_FIELDS)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_date", new Date().toISOString())
    .maybeSingle();
  if (error) {
    console.error("Could not load blog post:", error.message);
    return undefined;
  }
  return (data as unknown as BlogPost) ?? undefined;
}

/** Estimated reading time in whole minutes. */
export function readingMinutes(body: string) {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220));
}
