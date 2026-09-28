// Shared admin form and badge styles, matching the public site's forms.

export const LABEL = "block text-xs tracking-wider uppercase text-muted-foreground mb-2";
export const FIELD =
  "w-full bg-background border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors";
export const SELECT =
  "bg-background border border-border rounded-sm px-2 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none disabled:opacity-60";
export const BADGE = "inline-block text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full";

export const STATUS_TONE: Record<string, string> = {
  // jobs
  open: "bg-emerald-100 text-emerald-800",
  draft: "bg-zinc-200 text-zinc-700",
  closed: "bg-red-100 text-red-800",
  // inquiries
  new: "bg-accent/15 text-accent",
  in_review: "bg-amber-100 text-amber-800",
  contacted: "bg-emerald-100 text-emerald-800",
  // applications
  reviewing: "bg-amber-100 text-amber-800",
  shortlisted: "bg-sky-100 text-sky-800",
  rejected: "bg-red-100 text-red-800",
  hired: "bg-emerald-100 text-emerald-800",
};

export const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};
