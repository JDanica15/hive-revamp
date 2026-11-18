import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoCover } from "@/components/admin/BlogControls";
import { PostEditor, type EditorPost } from "@/components/admin/BlogEditor";
import { ArrowLeft } from "@/components/icons";
import { requireAdmin } from "@/lib/admin";
import type { BlogPost } from "@/lib/blog";
import { parseLinkSuggestions } from "@/lib/blog-sections";
import { IMAGES_ENABLED } from "@/lib/gemini";
import { SITE_URL } from "@/lib/site";
import { db } from "@/lib/supabase";

export const metadata: Metadata = { title: "Review post" };
// Section rewrites, SEO suggestions and AI covers run Gemini inside this page's server actions.
export const maxDuration = 120;

export default async function ReviewPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ image?: string; seo?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { image, seo } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await db().from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const post = data as BlogPost & { brief?: { keywords?: string } };
  const hasNotes = Boolean(post.fact_check_notes && !/^none\.?$/i.test(post.fact_check_notes.trim()));
  const hasFacts = Boolean(post.facts_used);

  const editorPost: EditorPost = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    tags: post.tags ?? [],
    cover_alt: post.cover_alt,
    cover_image_url: post.cover_image_url,
    image_prompt: post.image_prompt,
    // Columns from migration 006 are missing on older databases; fall back to empty values.
    meta_title: post.meta_title ?? "",
    meta_description: post.meta_description ?? "",
    focus_keyword: post.focus_keyword ?? "",
    link_suggestions: parseLinkSuggestions(post.link_suggestions),
    keywords: post.brief?.keywords ?? "",
    status: post.status,
    published_date: post.published_date,
    scheduledNow: post.status === "published" && Boolean(post.published_date) && new Date(post.published_date as string) > new Date(),
  };

  return (
    <section aria-labelledby="review-heading" className="space-y-6">
      <div>
        <Link href="/admin/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          All posts
        </Link>
        <h1 id="review-heading" className="font-heading text-2xl font-medium">
          Review post
        </h1>
        {post.source === "ai" && <p className="text-xs text-muted-foreground mt-1">Written by the AI writer ({post.model}). Please read it through before publishing.</p>}
      </div>

      {IMAGES_ENABLED && image === "pending" && !post.cover_image_url && <AutoCover postId={post.id} />}

      {(hasNotes || hasFacts) && (
        <details open={hasNotes} className={"border rounded-sm p-4 text-sm " + (hasNotes ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-background border-border")}>
          <summary className="cursor-pointer font-medium">Fact check{hasNotes ? ": the writer asks you to verify some claims" : ""}</summary>
          {hasNotes && <p className="mt-3 whitespace-pre-line">{post.fact_check_notes}</p>}
          {hasFacts && (
            <div className="mt-3">
              <p className="font-medium">Facts about Hive this post was written from</p>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">{post.facts_used}</p>
              <p className="mt-2 text-xs text-muted-foreground">Anything about Hive that isn&apos;t here or in your company brief shouldn&apos;t be in the post.</p>
            </div>
          )}
        </details>
      )}

      <PostEditor post={editorPost} siteHost={new URL(SITE_URL).host} imagesEnabled={IMAGES_ENABLED} initialTab={seo === "retry" ? "seo" : "article"} />
    </section>
  );
}
