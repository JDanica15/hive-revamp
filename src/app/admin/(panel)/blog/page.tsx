import type { Metadata } from "next";
import { AddTopicForm, BlogSettingsForm, GeminiCheck, GeneratePostForm, PostRowActions, RemoveTopicButton } from "@/components/admin/BlogControls";
import { BADGE, STATUS_TONE } from "@/components/admin/styles";
import { formatWhen, label, requireAdmin } from "@/lib/admin";
import type { BlogPost } from "@/lib/blog";
import { MIGRATION_HINT } from "@/lib/blog-settings";
import { GEMINI_CONFIGURED } from "@/lib/gemini";
import { db } from "@/lib/supabase";

export const metadata: Metadata = { title: "Blog" };
// "Write a post now" runs the Gemini agent inside this page's server action.
export const maxDuration = 120;

export default async function BlogAdminPage() {
  await requireAdmin();
  const [posts, topics, settings] = await Promise.all([
    db().from("blog_posts").select("id, slug, title, excerpt, status, source, cover_image_url, fact_check_notes, created_date, published_date").order("created_date", { ascending: false }).limit(100),
    db().from("blog_topics").select("id, topic, kind, facts").eq("status", "queued").order("created_date"),
    db().from("blog_settings").select("company_brief, hive_post_every").eq("id", 1).maybeSingle(),
  ]);
  const needsMigration = Boolean(topics.error || settings.error);
  if (posts.error) {
    return (
      <section>
        <h1 className="font-heading text-2xl font-medium mb-4">Blog</h1>
        <p className="text-destructive">
          The blog tables aren&apos;t installed yet. Run <code>supabase/migrations/004_blog.sql</code> in the Supabase SQL editor, then reload.
        </p>
        <p className="text-sm text-muted-foreground mt-2">{posts.error.message}</p>
      </section>
    );
  }
  const list = posts.data as unknown as BlogPost[];
  const queued = (topics.data ?? []) as { id: string; topic: string; kind: string; facts: string }[];
  const cfg = (settings.data as { company_brief: string; hive_post_every: number } | null) ?? { company_brief: "", hive_post_every: 3 };

  return (
    <section aria-labelledby="blog-heading" className="space-y-10">
      <div>
        <h1 id="blog-heading" className="font-heading text-2xl font-medium mb-2">
          Blog
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          The AI writer drafts a post with a cover image. Review it, fix anything, then publish.
          {process.env.BLOG_AUTO_PUBLISH === "true" ? " Auto-publish is ON: new posts go live without review." : ""}
        </p>
      </div>

      {!GEMINI_CONFIGURED && (
        <p className="bg-amber-50 border border-amber-200 text-amber-900 rounded-sm p-4 text-sm">
          <strong>GEMINI_API_KEY isn&apos;t set.</strong> Add it to <code>.env.local</code> (and your hosting environment variables), restart, and the writer will work.
        </p>
      )}

      {needsMigration && (
        <p className="bg-amber-50 border border-amber-200 text-amber-900 rounded-sm p-4 text-sm">
          <strong>One more setup step.</strong> {MIGRATION_HINT}
        </p>
      )}

      <GeneratePostForm />
      <GeminiCheck />

      <div>
        <h2 className="font-heading text-lg font-medium mb-3">About Hive</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          The writer doesn&apos;t know how Hive really works, so it only states what you tell it here. Write the facts once, and it can write about
          your use of AI, your priorities and more without making anything up.
        </p>
        <BlogSettingsForm brief={cfg.company_brief} every={cfg.hive_post_every} />
      </div>

      <div>
        <h2 className="font-heading text-lg font-medium mb-3">Topic queue</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The scheduled writer works through these oldest first, mixing in “About Hive” topics at the rotation you set above. When nothing is queued it picks a general topic itself.
        </p>
        <AddTopicForm />
        {queued.length === 0 ? (
          <p className="text-sm text-muted-foreground">No queued topics.</p>
        ) : (
          <ul className="space-y-2">
            {queued.map((t) => (
              <li key={t.id} className="bg-background border border-border rounded-sm px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
                <span className="min-w-0 break-words">
                  <span className={BADGE + " mr-2 " + (t.kind === "hive" ? "bg-accent/15 text-accent" : "bg-zinc-200 text-zinc-700")}>
                    {t.kind === "hive" ? "About Hive" : "General"}
                  </span>
                  {t.topic}
                  {t.facts && <span className="block text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">{t.facts}</span>}
                </span>
                <RemoveTopicButton id={t.id} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="font-heading text-lg font-medium mb-3">Posts</h2>
        {list.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">No posts yet. Click “Write a post now” to create the first one.</p>
        ) : (
          <ul className="space-y-3">
            {list.map((p) => (
              <li key={p.id} className="bg-background border border-border rounded-sm p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                {p.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of a Supabase-hosted file
                  <img src={p.cover_image_url} alt="" className="w-full lg:w-32 aspect-video object-cover rounded-sm border border-border shrink-0" />
                ) : (
                  <div className="w-full lg:w-32 aspect-video rounded-sm border border-dashed border-border grid place-items-center text-xs text-muted-foreground shrink-0">
                    No image
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-medium">{p.title}</span>
                    <span className={BADGE + " " + (STATUS_TONE[p.status === "published" ? "open" : p.status === "rejected" ? "closed" : "draft"] ?? "")}>{label(p.status)}</span>
                    {p.source === "ai" && <span className={BADGE + " bg-accent/15 text-accent"}>AI</span>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {formatWhen(p.created_date)}
                    {p.published_date ? ` · Published ${formatWhen(p.published_date)}` : ""}
                    {p.fact_check_notes && !/^none\.?$/i.test(p.fact_check_notes.trim()) ? " · Has fact-check notes" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <PostRowActions id={p.id} title={p.title} status={p.status} slug={p.slug} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
