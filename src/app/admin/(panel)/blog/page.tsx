import type { Metadata } from "next";
import Link from "next/link";
import { AddTopicForm, BlogSettingsForm, GeminiCheck, PostRowActions, RemoveTopicButton } from "@/components/admin/BlogControls";
import { BADGE, STATUS_TONE } from "@/components/admin/styles";
import { formatWhen, label, requireAdmin } from "@/lib/admin";
import type { BlogPost } from "@/lib/blog";
import { MIGRATION_HINT } from "@/lib/blog-settings";
import { GEMINI_CONFIGURED } from "@/lib/gemini";
import { db } from "@/lib/supabase";

export const metadata: Metadata = { title: "Blog" };

type Tab = "all" | "drafts" | "scheduled" | "published";
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "drafts", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
];

export default async function BlogAdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { tab: tabParam } = await searchParams;
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? (tabParam as Tab) : "all";

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
  const all = posts.data as unknown as BlogPost[];
  const queued = (topics.data ?? []) as { id: string; topic: string; kind: string; facts: string }[];
  const cfg = (settings.data as { company_brief: string; hive_post_every: number } | null) ?? { company_brief: "", hive_post_every: 3 };

  const now = Date.now();
  const isScheduled = (p: BlogPost) => p.status === "published" && Boolean(p.published_date) && new Date(p.published_date as string).getTime() > now;
  const matches: Record<Tab, (p: BlogPost) => boolean> = {
    all: () => true,
    drafts: (p) => p.status === "draft",
    scheduled: isScheduled,
    published: (p) => p.status === "published" && !isScheduled(p),
  };
  const list = all.filter(matches[tab]);

  return (
    <section aria-labelledby="blog-heading" className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 id="blog-heading" className="font-heading text-2xl font-medium mb-2">
            Blog
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Plan, write and publish posts with the AI writer. You review everything before it goes live.
            {process.env.BLOG_AUTO_PUBLISH === "true" ? " Auto-publish is ON: scheduled posts go live without review." : ""}
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          New post
        </Link>
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

      <div>
        <nav aria-label="Filter posts" className="flex flex-wrap gap-1 border-b border-border mb-4">
          {TABS.map((t) => {
            const count = all.filter(matches[t.id]).length;
            return (
              <Link
                key={t.id}
                href={t.id === "all" ? "/admin/blog" : `/admin/blog?tab=${t.id}`}
                aria-current={tab === t.id ? "page" : undefined}
                className={
                  "px-4 py-2.5 text-sm border-b-2 -mb-px whitespace-nowrap transition-colors " +
                  (tab === t.id ? "border-accent text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground")
                }
              >
                {t.label} <span className="text-xs text-muted-foreground">{count}</span>
              </Link>
            );
          })}
        </nav>

        {list.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            {all.length === 0 ? (
              <>
                No posts yet. Click <strong>New post</strong> to create the first one.
              </>
            ) : (
              "Nothing here."
            )}
          </p>
        ) : (
          <ul className="space-y-3">
            {list.map((p) => {
              const scheduled = isScheduled(p);
              return (
                <li key={p.id} className="bg-background border border-border rounded-sm p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <Link href={`/admin/blog/${p.id}`} className="font-medium hover:text-accent transition-colors">
                        {p.title}
                      </Link>
                      <span className={BADGE + " " + (scheduled ? "bg-sky-100 text-sky-800" : (STATUS_TONE[p.status === "published" ? "open" : p.status === "rejected" ? "closed" : "draft"] ?? ""))}>
                        {scheduled ? "Scheduled" : label(p.status)}
                      </span>
                      {p.source === "ai" && <span className={BADGE + " bg-accent/15 text-accent"}>AI</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {formatWhen(p.created_date)}
                      {p.published_date ? ` · ${scheduled ? "Goes live" : "Published"} ${formatWhen(p.published_date)}` : ""}
                      {p.fact_check_notes && !/^none\.?$/i.test(p.fact_check_notes.trim()) ? " · Has fact-check notes" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <PostRowActions id={p.id} title={p.title} status={p.status} slug={p.slug} scheduled={scheduled} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <details className="bg-background border border-border rounded-sm group" open={needsMigration}>
        <summary className="cursor-pointer px-5 py-4 font-medium">Writer settings</summary>
        <div className="px-5 pb-6 space-y-8 border-t border-border pt-5">
          <div>
            <h2 className="font-heading text-lg font-medium mb-2">About Hive</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
              The writer doesn&apos;t know how Hive really works, so it only states what you tell it here. Write the facts once, and it can write about your use of AI, your
              priorities and more without making anything up.
            </p>
            <BlogSettingsForm brief={cfg.company_brief} every={cfg.hive_post_every} />
          </div>

          <div>
            <h2 className="font-heading text-lg font-medium mb-2">Automatic drafts: topic queue</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
              A draft is also written automatically on the days set in <code>vercel.json</code>. It works through these topics oldest first, mixing in “About Hive” topics at the
              rotation above. When nothing is queued it picks a general topic itself. These drafts wait for your review like any other.
            </p>
            <AddTopicForm />
            {queued.length === 0 ? (
              <p className="text-sm text-muted-foreground">No queued topics.</p>
            ) : (
              <ul className="space-y-2">
                {queued.map((t) => (
                  <li key={t.id} className="border border-border rounded-sm px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
                    <span className="min-w-0 break-words">
                      <span className={BADGE + " mr-2 " + (t.kind === "hive" ? "bg-accent/15 text-accent" : "bg-zinc-200 text-zinc-700")}>{t.kind === "hive" ? "About Hive" : "General"}</span>
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
            <h2 className="font-heading text-lg font-medium mb-2">Connection</h2>
            <GeminiCheck />
          </div>
        </div>
      </details>
    </section>
  );
}
