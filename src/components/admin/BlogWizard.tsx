"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createArticle, createStrategy } from "@/app/admin/blog-actions";
import { PRIMARY } from "@/components/admin/BlogControls";
import { FIELD, LABEL } from "@/components/admin/styles";
import { LoaderCircle } from "@/components/icons";

// Steps 1 to 4 of the content flow. Nothing is saved until the article is written, so the editor can
// back out or change direction at no cost. After that the post opens in the review editor (steps 5 and 6).

const OBJECTIVES = ["Educate readers", "Build trust and credibility", "Generate enquiries", "Announce or explain something new"];
const TONES = ["Warm and practical", "Professional and polished", "Friendly and conversational", "Authoritative and direct"];

type BriefFields = { topic: string; audience: string; objective: string; keywords: string; tone: string; facts: string };
type PlanFields = { title: string; search_intent: string; talking_points: string; structure: string; keywords: string };

const EMPTY_BRIEF: BriefFields = {
  topic: "",
  audience: "Business owners and operations managers",
  objective: OBJECTIVES[0],
  keywords: "",
  tone: TONES[0],
  facts: "",
};

const STEPS = ["Brief", "Strategy", "Article and SEO", "Review", "Publish"];

export function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs" aria-label="Progress">
      {STEPS.map((label, i) => {
        const state = i < current ? "done" : i === current ? "now" : "todo";
        return (
          <li key={label} className="flex items-center gap-2" aria-current={state === "now" ? "step" : undefined}>
            <span
              className={
                "w-6 h-6 rounded-full grid place-items-center font-medium " +
                (state === "now" ? "bg-foreground text-background" : state === "done" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground")
              }
            >
              {i + 1}
            </span>
            <span className={state === "now" ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</span>
            {i < STEPS.length - 1 && <span className="w-4 h-px bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);

export function BlogWizard() {
  const router = useRouter();
  const [stage, setStage] = useState<"brief" | "plan">("brief");
  const [brief, setBrief] = useState<BriefFields>(EMPTY_BRIEF);
  const [plan, setPlan] = useState<PlanFields | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [working, startWork] = useTransition();

  const setB = (key: keyof BriefFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setBrief((b) => ({ ...b, [key]: e.target.value }));
  const setP = (key: keyof PlanFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPlan((p) => (p ? { ...p, [key]: e.target.value } : p));

  function makePlan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startWork(async () => {
      const res = await createStrategy(brief);
      if (res.error || !res.strategy || !res.brief) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      setBrief({ ...EMPTY_BRIEF, ...res.brief });
      setPlan({
        title: res.strategy.title,
        search_intent: res.strategy.search_intent,
        talking_points: res.strategy.talking_points.join("\n"),
        structure: res.strategy.structure.join("\n"),
        keywords: res.strategy.keywords.join(", "),
      });
      setStage("plan");
    });
  }

  function writeArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!plan) return;
    setError("");
    startWork(async () => {
      const res = await createArticle(brief, {
        title: plan.title,
        search_intent: plan.search_intent,
        talking_points: lines(plan.talking_points),
        structure: lines(plan.structure),
        keywords: plan.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      });
      if (res.error || !res.id) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      setNote(res.seoError ? "The article is ready. The SEO step didn't finish: use “Suggest SEO” on the SEO tab." : "");
      router.push(`/admin/blog/${res.id}${res.seoError ? "?seo=retry" : ""}`);
    });
  }

  return (
    <div className="space-y-6">
      <Stepper current={stage === "brief" ? 0 : 1} />

      {stage === "brief" && (
        <form onSubmit={makePlan} className="bg-background border border-border rounded-sm p-5 sm:p-8 space-y-6 max-w-3xl">
          <div>
            <h2 className="font-heading text-lg font-medium">Content brief</h2>
            <p className="text-sm text-muted-foreground mt-1">Tell the writer what you need. It will suggest a plan for you to approve before it writes anything.</p>
          </div>
          <div>
            <label htmlFor="topic" className={LABEL}>
              Blog topic or working title *
            </label>
            <input id="topic" required maxLength={200} value={brief.topic} onChange={setB("topic")} placeholder="e.g. How AI and people work together in outsourced bookkeeping" className={FIELD} />
          </div>
          <div>
            <label htmlFor="audience" className={LABEL}>
              Target audience
            </label>
            <input id="audience" maxLength={200} value={brief.audience} onChange={setB("audience")} className={FIELD} />
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="objective" className={LABEL}>
                Content objective
              </label>
              <select id="objective" value={brief.objective} onChange={setB("objective")} className={FIELD}>
                {OBJECTIVES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tone" className={LABEL}>
                Tone of voice
              </label>
              <select id="tone" value={brief.tone} onChange={setB("tone")} className={FIELD}>
                {TONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="keywords" className={LABEL}>
              Keywords (optional, comma separated)
            </label>
            <input id="keywords" maxLength={200} value={brief.keywords} onChange={setB("keywords")} placeholder="e.g. outsourced bookkeeping, offshore accounting" className={FIELD} />
          </div>
          <details className="group" open={Boolean(brief.facts)}>
            <summary className="cursor-pointer text-sm font-medium">Facts about Hive to include (only for posts about Hive itself)</summary>
            <textarea
              id="facts"
              rows={4}
              maxLength={4000}
              value={brief.facts}
              onChange={setB("facts")}
              placeholder={"One real detail per line. The writer states only these, plus your company brief, about Hive.\nExample: We use AI tools to draft first-pass reconciliations; a person always reviews them."}
              className={FIELD + " mt-3"}
              aria-label="Facts about Hive"
            />
          </details>
          <div className="flex items-center gap-4 flex-wrap">
            <button type="submit" disabled={working} className={PRIMARY}>
              {working && <LoaderCircle className="w-4 h-4 animate-spin" />}
              {working ? "Planning… about 10 seconds" : "Create the content plan"}
            </button>
            <Link href="/admin/blog" className="text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </Link>
            {error && (
              <p role="alert" className="text-sm text-destructive whitespace-pre-line">
                {error}
              </p>
            )}
          </div>
        </form>
      )}

      {stage === "plan" && plan && (
        <form onSubmit={writeArticle} className="bg-background border border-border rounded-sm p-5 sm:p-8 space-y-6 max-w-3xl">
          <div>
            <h2 className="font-heading text-lg font-medium">Content strategy</h2>
            <p className="text-sm text-muted-foreground mt-1">The writer&apos;s plan for “{brief.topic}”. Change anything you like: the article follows this plan.</p>
          </div>
          <div>
            <label htmlFor="plan-title" className={LABEL}>
              Suggested title
            </label>
            <input id="plan-title" required maxLength={120} value={plan.title} onChange={setP("title")} className={FIELD} />
          </div>
          <div>
            <label htmlFor="plan-intent" className={LABEL}>
              Target search intent
            </label>
            <textarea id="plan-intent" rows={2} maxLength={300} value={plan.search_intent} onChange={setP("search_intent")} className={FIELD} />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="plan-points" className={LABEL}>
                Key talking points (one per line)
              </label>
              <textarea id="plan-points" rows={8} value={plan.talking_points} onChange={setP("talking_points")} className={FIELD} />
            </div>
            <div>
              <label htmlFor="plan-structure" className={LABEL}>
                Section headings (one per line)
              </label>
              <textarea id="plan-structure" rows={8} required value={plan.structure} onChange={setP("structure")} className={FIELD} />
            </div>
          </div>
          <div>
            <label htmlFor="plan-keywords" className={LABEL}>
              SEO keyword suggestions (comma separated, main one first)
            </label>
            <input id="plan-keywords" value={plan.keywords} onChange={setP("keywords")} className={FIELD} />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button type="submit" disabled={working} className={PRIMARY}>
              {working && <LoaderCircle className="w-4 h-4 animate-spin" />}
              {working ? "Writing the article and SEO… up to a minute" : "Approve plan and write the article"}
            </button>
            <button type="button" disabled={working} onClick={() => setStage("brief")} className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-60">
              Back to the brief
            </button>
            {error && (
              <p role="alert" className="text-sm text-destructive whitespace-pre-line">
                {error}
              </p>
            )}
            {note && <p className="text-sm text-muted-foreground">{note}</p>}
          </div>
          <p className="text-xs text-muted-foreground">The article is saved as a draft for you to review. Nothing goes live until you publish or schedule it.</p>
        </form>
      )}
    </div>
  );
}
