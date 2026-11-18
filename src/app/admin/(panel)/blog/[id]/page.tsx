import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoCover, PostEditor } from "@/components/admin/BlogControls";
import { IMAGES_ENABLED } from "@/lib/gemini";
import { ArrowLeft } from "@/components/icons";
import { requireAdmin } from "@/lib/admin";
import type { BlogPost } from "@/lib/blog";
import { db } from "@/lib/supabase";

export const metadata: Metadata = { title: "Review post" };
// Regenerating the cover image runs Gemini inside this page's server action.
export const maxDuration = 120;

export default async function ReviewPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ image?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { image } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await db().from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const post = data as BlogPost;
  const hasNotes = post.fact_check_notes && !/^none\.?$/i.test(post.fact_check_notes.trim());

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
        {post.source === "ai" && <p className="text-xs text-muted-foreground mt-1">Written by the AI agent ({post.model}). Please read it through before publishing.</p>}
      </div>

      {IMAGES_ENABLED && image === "pending" && !post.cover_image_url && <AutoCover postId={post.id} />}

      {hasNotes && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-sm p-4 text-sm">
          <p className="font-medium mb-1">The writer asks you to verify:</p>
          <p className="whitespace-pre-line">{post.fact_check_notes}</p>
        </div>
      )}

      {post.facts_used && (
        <details className="bg-background border border-border rounded-sm p-4 text-sm">
          <summary className="cursor-pointer font-medium">Facts about Hive this post was written from</summary>
          <p className="mt-3 whitespace-pre-line text-muted-foreground">{post.facts_used}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Check the article against these. Anything about Hive that isn&apos;t here or in your company brief shouldn&apos;t be in the post.
          </p>
        </details>
      )}

      <PostEditor post={post} showImage={IMAGES_ENABLED} />
    </section>
  );
}
