"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  checkGeminiConnection,
  deletePost,
  generatePostNow,
  regeneratePostImage,
  removeTopic,
  savePost,
  setPostStatus,
} from "@/app/admin/blog-actions";
import { FIELD, LABEL } from "@/components/admin/styles";
import { LoaderCircle, Trash2 } from "@/components/icons";

const BUTTON =
  "px-3 py-1.5 rounded-sm border border-border text-xs font-medium hover:bg-muted disabled:opacity-60 transition-colors";
const PRIMARY =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors";

function Notice({ state }: { state: { error?: string; info?: string } | null }) {
  if (!state) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={"text-sm whitespace-pre-line " + (state.error ? "text-destructive" : "text-emerald-700")}
    >
      {state.error ?? state.info}
    </p>
  );
}

function Pending({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={PRIMARY}>
      {pending && <LoaderCircle className="w-4 h-4 animate-spin" />}
      {pending ? busy : idle}
    </button>
  );
}

/** "Write a post now": optional topic, then the agent writes the post and draws the cover. */
export function GeneratePostForm() {
  const [state, action] = useActionState(generatePostNow, null);
  return (
    <form action={action} className="bg-background border border-border rounded-sm p-5 space-y-4">
      <div>
        <label htmlFor="topic" className={LABEL}>
          Topic (optional)
        </label>
        <input
          id="topic"
          name="topic"
          maxLength={200}
          placeholder="Leave empty to use the next queued topic, or let the agent choose"
          className={FIELD}
        />
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <Pending idle="Write a post now" busy="Writing and drawing… this takes about a minute" />
        <Notice state={state} />
      </div>
      <p className="text-xs text-muted-foreground">
        The agent writes the article, creates a cover image and saves it as a draft. Nothing goes live until you publish it.
      </p>
    </form>
  );
}

export function GeminiCheck() {
  const [state, action] = useActionState(async () => checkGeminiConnection(), null);
  return (
    <form action={action} className="flex items-start gap-3 flex-wrap">
      <CheckButton />
      <Notice state={state} />
    </form>
  );
}
function CheckButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={BUTTON}>
      {pending ? "Checking…" : "Check Gemini connection"}
    </button>
  );
}

export function PostRowActions({ id, title, status, slug }: { id: string; title: string; status: string; slug: string }) {
  const [pending, start] = useTransition();
  return (
    <>
      {status === "published" ? (
        <>
          <Link href={`/blog/${slug}`} target="_blank" className={BUTTON}>
            View
          </Link>
          <button type="button" disabled={pending} onClick={() => start(() => setPostStatus(id, "draft"))} className={BUTTON}>
            Unpublish
          </button>
        </>
      ) : (
        <button type="button" disabled={pending} onClick={() => start(() => setPostStatus(id, "published"))} className={BUTTON}>
          Publish
        </button>
      )}
      <Link href={`/admin/blog/${id}`} className={BUTTON}>
        Review
      </Link>
      <button
        type="button"
        disabled={pending}
        aria-label={`Delete ${title}`}
        onClick={() => {
          if (confirm(`Delete "${title}"? This can't be undone.`)) start(() => deletePost(id));
        }}
        className={BUTTON + " text-destructive hover:bg-destructive/10"}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </>
  );
}

export function RemoveTopicButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => removeTopic(id))} className={BUTTON} aria-label="Remove topic">
      Remove
    </button>
  );
}

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  cover_alt: string;
  status: string;
  image_prompt: string;
  cover_image_url: string;
};

/** Edit form for one post, plus a separate form to regenerate the cover. */
export function PostEditor({ post }: { post: Post }) {
  const [state, action] = useActionState(savePost, null);
  const [imgState, imgAction] = useActionState(regeneratePostImage, null);

  return (
    <div className="space-y-6">
      <form action={imgAction} className="bg-background border border-border rounded-sm p-5 sm:p-6 space-y-4">
        <input type="hidden" name="id" value={post.id} />
        <h2 className="font-heading text-lg font-medium">Cover image</h2>
        <div className="grid sm:grid-cols-[16rem_1fr] gap-5 items-start">
          {post.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of a Supabase-hosted file
            <img src={post.cover_image_url} alt={post.cover_alt} className="w-full aspect-video object-cover rounded-sm border border-border" />
          ) : (
            <div className="w-full aspect-video rounded-sm border border-dashed border-border grid place-items-center text-sm text-muted-foreground text-center p-4">
              No image yet. Generate one below.
            </div>
          )}
          <div className="space-y-3">
            <label htmlFor="image_prompt" className={LABEL}>
              Image prompt
            </label>
            <textarea id="image_prompt" name="image_prompt" rows={3} maxLength={600} defaultValue={post.image_prompt} className={FIELD} />
            <div className="flex items-center gap-4 flex-wrap">
              <Pending idle={post.cover_image_url ? "Regenerate image" : "Generate image"} busy="Drawing… up to a minute" />
              <Notice state={imgState} />
            </div>
          </div>
        </div>
      </form>

      <form action={action} className="bg-background border border-border rounded-sm p-5 sm:p-8 space-y-6">
        <input type="hidden" name="id" value={post.id} />
        <div>
          <label htmlFor="title" className={LABEL}>
            Title *
          </label>
          <input id="title" name="title" required maxLength={120} defaultValue={post.title} className={FIELD} />
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="slug" className={LABEL}>
              URL slug
            </label>
            <input id="slug" name="slug" maxLength={100} defaultValue={post.slug} className={FIELD} />
          </div>
          <div>
            <label htmlFor="tags" className={LABEL}>
              Tags (comma separated)
            </label>
            <input id="tags" name="tags" maxLength={200} defaultValue={post.tags.join(", ")} className={FIELD} />
          </div>
        </div>
        <div>
          <label htmlFor="excerpt" className={LABEL}>
            Excerpt
          </label>
          <input id="excerpt" name="excerpt" maxLength={300} defaultValue={post.excerpt} className={FIELD} />
        </div>
        <div>
          <label htmlFor="cover_alt" className={LABEL}>
            Cover image description (alt text)
          </label>
          <input id="cover_alt" name="cover_alt" maxLength={200} defaultValue={post.cover_alt} className={FIELD} />
        </div>
        <div>
          <label htmlFor="body" className={LABEL}>
            Article *
          </label>
          <textarea id="body" name="body" required rows={22} defaultValue={post.body} className={FIELD + " font-mono text-sm leading-relaxed"} />
          <p className="text-xs text-muted-foreground mt-2">Use ## for headings, - for bullets, **bold**, and [text](https://link).</p>
        </div>
        <div className="max-w-xs">
          <label htmlFor="status" className={LABEL}>
            Status
          </label>
          <select id="status" name="status" defaultValue={post.status} className={FIELD}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published (visible on the site)</option>
            <option value="rejected">Rejected (hidden)</option>
          </select>
        </div>
        <div className="flex items-center justify-end gap-4 flex-wrap pt-2">
          <Notice state={state} />
          <Link href="/admin/blog" className="px-5 py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">
            Back to posts
          </Link>
          <Pending idle="Save changes" busy="Saving…" />
        </div>
      </form>
    </div>
  );
}
