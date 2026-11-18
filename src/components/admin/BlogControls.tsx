"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import {
  addTopic,
  checkGeminiConnection,
  deletePost,
  generateCoverFor,
  removeTopic,
  saveBlogSettings,
  setPostStatus,
} from "@/app/admin/blog-actions";
import { FIELD, LABEL } from "@/components/admin/styles";
import { LoaderCircle, Trash2 } from "@/components/icons";

export const BUTTON =
  "px-3 py-1.5 rounded-sm border border-border text-xs font-medium hover:bg-muted disabled:opacity-60 transition-colors";
export const PRIMARY =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors";

type NoticeState = { error?: string; info?: string } | null;

// Success messages fade out after 3 seconds; errors stay longer (8 seconds, or until dismissed) because
// they usually need to be read and acted on.
const SUCCESS_MS = 3000;
const ERROR_MS = 8000;
const FADE_MS = 400;

function Toast({ state }: { state: NoticeState }) {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("gone");
  useEffect(() => {
    if (!state) return;
    setPhase("in");
    const ms = state.error ? ERROR_MS : SUCCESS_MS;
    const fade = setTimeout(() => setPhase("out"), ms);
    const done = setTimeout(() => setPhase("gone"), ms + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [state]);
  if (!state || phase === "gone") return null;
  const isError = Boolean(state.error);
  return (
    <div
      role={isError ? "alert" : "status"}
      data-testid="toast"
      className={
        "fixed top-5 right-5 z-50 max-w-sm flex items-start gap-3 rounded-sm border px-4 py-3 text-sm shadow-lg whitespace-pre-line transition-opacity ease-out " +
        (phase === "out" ? "opacity-0 " : "opacity-100 ") +
        (isError ? "bg-red-50 border-red-200 text-red-900" : "bg-emerald-50 border-emerald-200 text-emerald-900")
      }
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <span className="min-w-0">{state.error ?? state.info}</span>
      {isError && (
        <button type="button" onClick={() => setPhase("gone")} aria-label="Dismiss message" className="shrink-0 -my-1 px-1 text-lg leading-none opacity-70 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  );
}

/** Action feedback. A toast by default; `inline` keeps long results (like the connection check) on the page. */
export function Notice({ state, inline = false }: { state: NoticeState; inline?: boolean }) {
  if (!inline) return <Toast state={state} />;
  if (!state) return null;
  return (
    <p role={state.error ? "alert" : "status"} className={"text-sm whitespace-pre-line " + (state.error ? "text-destructive" : "text-emerald-700")}>
      {state.error ?? state.info}
    </p>
  );
}

export function Pending({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={PRIMARY}>
      {pending && <LoaderCircle className="w-4 h-4 animate-spin" />}
      {pending ? busy : idle}
    </button>
  );
}

export function GeminiCheck() {
  const [state, action] = useActionState(
    async () => checkGeminiConnection(),
    null,
  );
  return (
    <form action={action} className="flex items-start gap-3 flex-wrap">
      <CheckButton />
      <Notice state={state} inline />
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

export function PostRowActions({
  id,
  title,
  status,
  slug,
  scheduled = false,
}: {
  id: string;
  title: string;
  status: string;
  slug: string;
  scheduled?: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <>
      {status === "published" ? (
        <>
          {!scheduled && (
            <Link href={`/blog/${slug}`} target="_blank" className={BUTTON}>
              View
            </Link>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => setPostStatus(id, "draft"))}
            className={BUTTON}
          >
            {scheduled ? "Unschedule" : "Unpublish"}
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => setPostStatus(id, "published"))}
          className={BUTTON}
        >
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
          if (confirm(`Delete "${title}"? This can't be undone.`))
            start(() => deletePost(id));
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
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => removeTopic(id))}
      className={BUTTON}
      aria-label="Remove topic"
    >
      Remove
    </button>
  );
}

/** Queue a topic, optionally as an "About Hive" post with the facts the writer may use. */
export function AddTopicForm() {
  const [state, action] = useActionState(addTopic, null);
  return (
    <form
      action={action}
      className="bg-background border border-border rounded-sm p-5 space-y-4 max-w-3xl mb-4"
    >
      <div className="grid sm:grid-cols-[1fr_12rem] gap-4">
        <div>
          <label htmlFor="queue-topic" className={LABEL}>
            Topic
          </label>
          <input
            id="queue-topic"
            name="topic"
            required
            maxLength={200}
            placeholder="e.g. How Hive combines AI tools with a human team"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="queue-kind" className={LABEL}>
            Type
          </label>
          <select
            id="queue-kind"
            name="kind"
            defaultValue="general"
            className={FIELD}
          >
            <option value="general">General</option>
            <option value="hive">About Hive</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="queue-facts" className={LABEL}>
          Facts about Hive (required for “About Hive” topics)
        </label>
        <textarea
          id="queue-facts"
          name="facts"
          rows={3}
          maxLength={4000}
          placeholder="One real fact per line. The writer states only these and never invents more."
          className={FIELD}
        />
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <Pending idle="Add to queue" busy="Adding…" />
        <Notice state={state} />
      </div>
    </form>
  );
}

/** The company brief (facts the writer may state about Hive) and how often a Hive post comes up. */
export function BlogSettingsForm({
  brief,
  every,
}: {
  brief: string;
  every: number;
}) {
  const [state, action] = useActionState(saveBlogSettings, null);
  return (
    <form
      action={action}
      className="bg-background border border-border rounded-sm p-5 space-y-4"
    >
      <div>
        <label htmlFor="company_brief" className={LABEL}>
          Company brief
        </label>
        <textarea
          id="company_brief"
          name="company_brief"
          rows={8}
          maxLength={6000}
          defaultValue={brief}
          placeholder={
            "Write true things about Hive that every post may rely on: what you do, who you serve, your values, how AI is used, what stays human. Short lines or bullets.\n\nThe writer states ONLY what is written here (or in a topic's own facts) about Hive."
          }
          className={FIELD}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Keep it accurate and current. If it isn&apos;t written here, the
          writer won&apos;t say it about Hive.
        </p>
      </div>
      <div className="max-w-sm">
        <label htmlFor="hive_post_every" className={LABEL}>
          Scheduled posts about Hive
        </label>
        <select
          id="hive_post_every"
          name="hive_post_every"
          defaultValue={String(every)}
          className={FIELD}
        >
          <option value="0">Never rotate (follow the queue order)</option>
          <option value="2">Every 2nd post</option>
          <option value="3">Every 3rd post</option>
          <option value="4">Every 4th post</option>
          <option value="5">Every 5th post</option>
        </select>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <Pending idle="Save brief and rotation" busy="Saving…" />
        <Notice state={state} />
      </div>
    </form>
  );
}

/**
 * Shown on the review page right after a post is written: draws the cover image as its own
 * request, then reloads the page to show it. If it fails, the article is safe and you can retry.
 */
export function AutoCover({ postId }: { postId: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [running, setRunning] = useState(true);
  const [error, setError] = useState("");

  const run = () => {
    setRunning(true);
    setError("");
    generateCoverFor(postId)
      .then((result) => {
        if (result?.error) setError(result.error);
        else router.replace(`/admin/blog/${postId}`);
        router.refresh();
      })
      .catch(() =>
        setError(
          "The request was interrupted. Click “Try again”, or use “Generate image” below.",
        ),
      )
      .finally(() => setRunning(false));
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when the page opens
  }, []);

  return (
    <div
      role="status"
      className="bg-accent/10 border border-accent/30 rounded-sm p-4 text-sm flex items-center gap-3 flex-wrap"
    >
      {running ? (
        <>
          <LoaderCircle className="w-4 h-4 animate-spin shrink-0" />
          <span>
            Drawing the cover image… this can take up to a minute. You can start
            reading the article below.
          </span>
        </>
      ) : (
        <>
          <span className="text-destructive whitespace-pre-line">
            {error || "Done."}
          </span>
          {error && (
            <button type="button" onClick={run} className={BUTTON}>
              Try again
            </button>
          )}
        </>
      )}
    </div>
  );
}
