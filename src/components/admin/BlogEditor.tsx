"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { regeneratePostImage, rewritePostSection, savePost, suggestSeo } from "@/app/admin/blog-actions";
import { BUTTON, Notice, PRIMARY, Pending } from "@/components/admin/BlogControls";
import { Stepper } from "@/components/admin/BlogWizard";
import { FIELD, LABEL } from "@/components/admin/styles";
import { Markdown } from "@/components/blog/Markdown";
import { LoaderCircle } from "@/components/icons";
import { insertLink, splitParts, wordCount, type LinkSuggestion } from "@/lib/blog-sections";

// Review (step 5) and publish (step 6). One form holds every field; the tabs only decide which are
// visible, so "Save" always saves everything. AI suggestions land in the fields and are only stored
// when the editor presses Save.

export type EditorPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  cover_alt: string;
  cover_image_url: string;
  image_prompt: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  link_suggestions: LinkSuggestion[];
  keywords: string;
  status: string;
  published_date: string | null;
  scheduledNow: boolean;
};

type Tab = "article" | "seo" | "cover" | "preview" | "publish";
type Mode = "draft" | "publish" | "schedule" | "rejected";
type Msg = { error?: string; info?: string } | null;

const TABS: { id: Tab; label: string }[] = [
  { id: "article", label: "Article" },
  { id: "seo", label: "SEO" },
  { id: "cover", label: "Cover image" },
  { id: "preview", label: "Preview" },
  { id: "publish", label: "Publish" },
];

const pad = (n: number) => String(n).padStart(2, "0");
function toLocalInput(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initialMode(post: EditorPost): Mode {
  if (post.status === "rejected") return "rejected";
  if (post.status === "published") return post.scheduledNow ? "schedule" : "publish";
  return "draft";
}

function Count({ value, max }: { value: string; max: number }) {
  return (
    <span className={"text-xs ml-2 " + (value.length > max ? "text-destructive" : "text-muted-foreground")}>
      {value.length}/{max}
    </span>
  );
}

export function PostEditor({ post, siteHost, imagesEnabled, initialTab = "article" }: { post: EditorPost; siteHost: string; imagesEnabled: boolean; initialTab?: Tab }) {
  const [state, action] = useActionState(savePost, null);
  const [imgState, imgAction] = useActionState(regeneratePostImage, null);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [tags, setTags] = useState(post.tags.join(", "));
  const [metaTitle, setMetaTitle] = useState(post.meta_title);
  const [metaDesc, setMetaDesc] = useState(post.meta_description);
  const [focus, setFocus] = useState(post.focus_keyword);
  const [coverAlt, setCoverAlt] = useState(post.cover_alt);
  const [links, setLinks] = useState<LinkSuggestion[]>(post.link_suggestions);
  const [mode, setMode] = useState<Mode>(initialMode(post));
  const [when, setWhen] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [instruction, setInstruction] = useState("");
  const [busySection, setBusySection] = useState<number | null>(null);
  const [aiMsg, setAiMsg] = useState<Msg>(null);
  const [seoMsg, setSeoMsg] = useState<Msg>(null);
  const [seoBusy, startSeo] = useTransition();
  const [, startSection] = useTransition();
  const [zone, setZone] = useState("");

  // Browser-local time zone details can only be known after mount (the server is in UTC).
  useEffect(() => {
    setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (post.status === "published" && post.published_date && post.scheduledNow) setWhen(toLocalInput(post.published_date));
  }, [post.status, post.published_date, post.scheduledNow]);

  // After a successful save the form fields reset, so forget the chosen file and the remove tick.
  useEffect(() => {
    if (state?.info) {
      setFileUrl(null);
      setRemoveCover(false);
    }
  }, [state]);

  const parts = useMemo(() => splitParts(body), [body]);
  const words = wordCount(body);
  const publishAt = when ? new Date(when) : null;
  const publishAtIso = publishAt && !Number.isNaN(publishAt.getTime()) ? publishAt.toISOString() : "";
  const coverShown = fileUrl ?? (removeCover ? "" : post.cover_image_url);

  function rewrite(index: number) {
    setAiMsg(null);
    setBusySection(index);
    startSection(async () => {
      const res = await rewritePostSection({ title, body, index, instruction });
      setBusySection(null);
      if (res.error || !res.body) {
        setAiMsg({ error: res.error ?? "Something went wrong." });
        return;
      }
      setBody(res.body);
      setAiMsg({ info: "Section rewritten. Read it, then press Save changes to keep it." });
    });
  }

  function suggest() {
    setSeoMsg(null);
    startSeo(async () => {
      const res = await suggestSeo({ title, body, keywords: [focus, post.keywords].filter(Boolean).join(", ") });
      if (res.error || !res.seo) {
        setSeoMsg({ error: res.error ?? "Something went wrong." });
        return;
      }
      setMetaTitle(res.seo.meta_title);
      setMetaDesc(res.seo.meta_description);
      setFocus(res.seo.focus_keyword);
      if (res.seo.slug && post.status !== "published") setSlug(res.seo.slug);
      setLinks(res.seo.link_suggestions);
      setSeoMsg({ info: "Suggestions filled in below. Adjust them, then press Save changes." });
    });
  }

  function addLink(link: LinkSuggestion) {
    const res = insertLink(body, link.anchor, link.path);
    setLinks((l) => l.filter((x) => x.path !== link.path));
    if (res.ok) {
      setBody(res.body);
      setSeoMsg({ info: `Linked “${link.anchor}” in the article. Press Save changes to keep it.` });
    } else {
      setSeoMsg({ error: `“${link.anchor}” isn't in the article (as plain text) any more, so that link was dropped.` });
    }
  }

  const frameText = device === "mobile";

  return (
    <div className="space-y-6">
      <Stepper current={tab === "publish" ? 4 : 3} />

      <form action={action} className="bg-background border border-border rounded-sm">
        <input type="hidden" name="id" value={post.id} />
        <input type="hidden" name="link_suggestions" value={JSON.stringify(links)} />
        <input type="hidden" name="publish_at" value={publishAtIso} />
        <input type="hidden" name="image_prompt" value={post.image_prompt} />

        <div role="tablist" aria-label="Post sections" className="flex flex-wrap gap-1 border-b border-border px-3 pt-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={
                "px-4 py-2.5 text-sm rounded-t-sm border-b-2 -mb-px transition-colors " +
                (tab === t.id ? "border-accent text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ARTICLE */}
        <div role="tabpanel" id="panel-article" aria-labelledby="tab-article" hidden={tab !== "article"} className="p-5 sm:p-8 space-y-6">
          <div>
            <label htmlFor="title" className={LABEL}>
              Title *
            </label>
            <input id="title" name="title" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className={FIELD} />
          </div>
          <div>
            <label htmlFor="body" className={LABEL}>
              Article *<span className="normal-case tracking-normal ml-2 text-xs">{words} words</span>
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={20}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={FIELD + " font-mono text-sm leading-relaxed"}
            />
            <p className="text-xs text-muted-foreground mt-2">Use ## for headings, - for bullets, **bold**, and [text](https://link). Links to your own pages look like [text](/careers).</p>
          </div>

          <div className="border border-border rounded-sm p-4 space-y-3">
            <div>
              <h3 className="text-sm font-medium">Regenerate a section</h3>
              <p className="text-xs text-muted-foreground mt-1">Rewrites just that section and leaves the rest alone. Add an instruction if you want a specific change.</p>
            </div>
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              maxLength={400}
              placeholder="Optional instruction, e.g. “shorter, with a bullet list” or “less formal”"
              className={FIELD}
              aria-label="Instruction for the rewrite"
            />
            <ul className="divide-y divide-border">
              {parts.map((p, i) =>
                p.text ? (
                  <li key={i} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm min-w-0 truncate">
                      {p.heading} <span className="text-xs text-muted-foreground">· {wordCount(p.text)} words</span>
                    </span>
                    <button type="button" disabled={busySection !== null} onClick={() => rewrite(i)} className={BUTTON}>
                      {busySection === i ? (
                        <span className="inline-flex items-center gap-1.5">
                          <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> Rewriting…
                        </span>
                      ) : (
                        "Regenerate"
                      )}
                    </button>
                  </li>
                ) : null,
              )}
            </ul>
            <Notice state={aiMsg} />
          </div>
        </div>

        {/* SEO */}
        <div role="tabpanel" id="panel-seo" aria-labelledby="tab-seo" hidden={tab !== "seo"} className="p-5 sm:p-8 space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            <button type="button" onClick={suggest} disabled={seoBusy} className={PRIMARY}>
              {seoBusy && <LoaderCircle className="w-4 h-4 animate-spin" />}
              {seoBusy ? "Working… about 15 seconds" : "Suggest SEO with AI"}
            </button>
            <Notice state={seoMsg} />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="focus_keyword" className={LABEL}>
                Focus keyword
              </label>
              <input id="focus_keyword" name="focus_keyword" maxLength={60} value={focus} onChange={(e) => setFocus(e.target.value)} className={FIELD} />
            </div>
            <div>
              <label htmlFor="slug" className={LABEL}>
                URL slug
              </label>
              <input id="slug" name="slug" maxLength={100} value={slug} onChange={(e) => setSlug(e.target.value)} className={FIELD} />
            </div>
          </div>
          <div>
            <label htmlFor="meta_title" className={LABEL}>
              Meta title <Count value={metaTitle} max={60} />
            </label>
            <input id="meta_title" name="meta_title" maxLength={70} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Leave empty to use the post title" className={FIELD} />
          </div>
          <div>
            <label htmlFor="meta_description" className={LABEL}>
              Meta description <Count value={metaDesc} max={155} />
            </label>
            <textarea id="meta_description" name="meta_description" rows={2} maxLength={170} value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} placeholder="Leave empty to use the excerpt" className={FIELD} />
          </div>

          <div className="rounded-sm border border-border p-4 bg-muted/40" aria-label="Search result preview">
            <p className="text-xs text-muted-foreground mb-2">How it may look in a Google result</p>
            <p className="text-xs text-muted-foreground truncate">
              {siteHost} › blog › {slug || "…"}
            </p>
            <p className="text-lg text-sky-800 leading-snug mt-0.5">{metaTitle || title || "Post title"}</p>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{metaDesc || excerpt || "The excerpt shows here."}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="excerpt" className={LABEL}>
                Excerpt (shown on the blog list)
              </label>
              <input id="excerpt" name="excerpt" maxLength={300} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={FIELD} />
            </div>
            <div>
              <label htmlFor="tags" className={LABEL}>
                Tags (comma separated)
              </label>
              <input id="tags" name="tags" maxLength={200} value={tags} onChange={(e) => setTags(e.target.value)} className={FIELD} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium">Internal link suggestions</h3>
            {links.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">None right now. “Suggest SEO with AI” looks for places to link to your own pages.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {links.map((l) => (
                  <li key={l.path} className="flex items-start justify-between gap-3 border border-border rounded-sm p-3 text-sm">
                    <span className="min-w-0">
                      Link <strong>“{l.anchor}”</strong> to <code className="text-xs">{l.path}</code>
                      {l.reason && <span className="block text-xs text-muted-foreground mt-0.5">{l.reason}</span>}
                    </span>
                    <span className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => addLink(l)} className={BUTTON}>
                        Add to article
                      </button>
                      <button type="button" onClick={() => setLinks((x) => x.filter((y) => y.path !== l.path))} className={BUTTON} aria-label={`Dismiss link to ${l.path}`}>
                        Dismiss
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* COVER */}
        <div role="tabpanel" id="panel-cover" aria-labelledby="tab-cover" hidden={tab !== "cover"} className="p-5 sm:p-8 space-y-6">
          <div className="grid sm:grid-cols-[16rem_1fr] gap-6 items-start">
            {coverShown ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview of a Supabase-hosted or just-chosen file
              <img src={coverShown} alt={coverAlt} className="w-full aspect-video object-cover rounded-sm border border-border" />
            ) : (
              <div className="w-full aspect-video rounded-sm border border-dashed border-border grid place-items-center text-sm text-muted-foreground text-center p-4">No cover image. Posts publish fine without one.</div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="cover_file" className={LABEL}>
                  Upload a cover image (optional)
                </label>
                <input
                  id="cover_file"
                  name="cover_file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={FIELD}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setFileUrl(f ? URL.createObjectURL(f) : null);
                    if (f) setRemoveCover(false);
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">PNG, JPG or WebP, up to 4 MB, ideally wide (16:9). Uploading replaces the current image.</p>
              </div>
              {post.cover_image_url && (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" name="remove_cover" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} /> Remove the current image
                </label>
              )}
              <div>
                <label htmlFor="cover_alt" className={LABEL}>
                  Image description (alt text)
                </label>
                <input id="cover_alt" name="cover_alt" maxLength={200} value={coverAlt} onChange={(e) => setCoverAlt(e.target.value)} className={FIELD} />
              </div>
              {post.image_prompt && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium">Image idea from the writer</summary>
                  <p className="mt-2 text-muted-foreground">{post.image_prompt}</p>
                  <p className="text-xs text-muted-foreground mt-2">Paste this into Gemini or any image tool to make a cover, then upload it above.</p>
                </details>
              )}
              {imagesEnabled && (
                <button type="submit" formAction={imgAction} className={BUTTON}>
                  {post.cover_image_url ? "Regenerate with AI" : "Generate with AI"}
                </button>
              )}
              <Notice state={imgState} />
            </div>
          </div>
        </div>

        {/* PREVIEW */}
        <div role="tabpanel" id="panel-preview" aria-labelledby="tab-preview" hidden={tab !== "preview"} className="p-5 sm:p-8 space-y-4">
          <div className="flex items-center gap-2" role="group" aria-label="Preview size">
            {(["desktop", "mobile"] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={BUTTON + (device === d ? " bg-foreground text-background hover:bg-foreground" : "")}
              >
                {d === "desktop" ? "Desktop" : "Mobile"}
              </button>
            ))}
            <span className="text-xs text-muted-foreground ml-2">What you see here is unsaved. Press Save changes to keep it.</span>
          </div>
          <div className="bg-muted/50 rounded-sm p-3 sm:p-6 overflow-x-auto">
            <article
              data-testid="preview-frame"
              data-device={device}
              className={"bg-background border border-border rounded-sm mx-auto " + (frameText ? "w-[390px] max-w-full" : "w-full max-w-4xl")}
            >
              <div className={frameText ? "px-5 pt-8" : "px-12 pt-12 max-w-3xl mx-auto"}>
                <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">{Math.max(1, Math.round(words / 220))} min read</p>
                <h1 className={"mt-3 font-heading font-medium text-balance leading-[1.1] " + (frameText ? "text-3xl" : "text-5xl")}>{title || "Untitled"}</h1>
                {excerpt && <p className={"mt-4 text-muted-foreground leading-relaxed " + (frameText ? "text-base" : "text-xl")}>{excerpt}</p>}
              </div>
              {coverShown && (
                <div className={frameText ? "px-5 mt-6" : "px-12 mt-8"}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- preview of a Supabase-hosted or just-chosen file */}
                  <img src={coverShown} alt={coverAlt} className="w-full aspect-video object-cover rounded-sm" />
                </div>
              )}
              <div className={(frameText ? "px-5" : "px-12 max-w-3xl mx-auto") + " mt-8 pb-10"}>
                <Markdown source={body} />
              </div>
            </article>
          </div>
        </div>

        {/* PUBLISH */}
        <div role="tabpanel" id="panel-publish" aria-labelledby="tab-publish" hidden={tab !== "publish"} className="p-5 sm:p-8 space-y-5">
          <fieldset className="space-y-3">
            <legend className={LABEL}>What should happen to this post?</legend>
            {(
              [
                ["draft", "Save as draft", "Stays hidden. Come back to it any time."],
                ["publish", "Publish now", "Goes live on the blog straight away."],
                ["schedule", "Schedule", "Goes live by itself at the date and time you choose."],
                ["rejected", "Reject", "Hidden, and marked as not wanted."],
              ] as const
            ).map(([value, label, help]) => (
              <label key={value} className={"flex items-start gap-3 border rounded-sm p-3 cursor-pointer " + (mode === value ? "border-accent bg-accent/5" : "border-border")}>
                <input type="radio" name="publish_mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="mt-1" />
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{help}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {mode === "schedule" && (
            <div className="max-w-sm">
              <label htmlFor="publish_when" className={LABEL}>
                Publish on
              </label>
              <input id="publish_when" type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} className={FIELD} />
              <p className="text-xs text-muted-foreground mt-2">
                {zone ? `Your time zone: ${zone}. ` : ""}The post appears within about 5 minutes after this time.
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-4 flex-wrap px-5 sm:px-8 py-4 border-t border-border bg-background rounded-b-sm">
          <Notice state={state} />
          <Link href="/admin/blog" className="px-5 py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">
            Back to posts
          </Link>
          <Pending idle={mode === "publish" ? "Save and publish" : mode === "schedule" ? "Save and schedule" : "Save changes"} busy="Saving…" />
        </div>
      </form>
    </div>
  );
}
