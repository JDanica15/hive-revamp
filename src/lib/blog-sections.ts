// Pure helpers for the blog editor (no server-only imports, so client components can use them too).

/** Pages the writer may suggest linking to. Hash links point at sections of the one-page home. */
export const INTERNAL_PAGES = [
  { path: "/#services", label: "Services overview (HR, bookkeeping and customer service outsourcing)" },
  { path: "/#hive", label: "Our people: the Hive team" },
  { path: "/#contact", label: "Contact us / start a conversation" },
  { path: "/careers", label: "Careers and open roles" },
  { path: "/our-events", label: "Company events" },
  { path: "/gallery", label: "Photo gallery" },
  { path: "/blog", label: "All blog posts" },
] as const;

export type LinkSuggestion = { path: string; anchor: string; reason: string };

export function isInternalPath(path: string) {
  return INTERNAL_PAGES.some((p) => p.path === path);
}

/** Parses the stored/submitted suggestion list, keeping only well-formed items that point at real pages. */
export function parseLinkSuggestions(value: unknown): LinkSuggestion[] {
  let raw: unknown = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: LinkSuggestion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { path, anchor, reason } = item as Record<string, unknown>;
    if (typeof path !== "string" || typeof anchor !== "string" || !isInternalPath(path)) continue;
    const a = anchor.replace(/\s+/g, " ").trim().slice(0, 80);
    if (!a || /[[\]()]/.test(a) || seen.has(path)) continue;
    seen.add(path);
    out.push({ path, anchor: a, reason: typeof reason === "string" ? reason.replace(/\s+/g, " ").trim().slice(0, 200) : "" });
    if (out.length >= 5) break;
  }
  return out;
}

export type Part = { heading: string; text: string; isIntro: boolean };

/**
 * Splits an article into its introduction (the text before the first "## " heading) and one part per
 * "## " section. parts[0] is always the introduction, which may be empty.
 */
export function splitParts(body: string): Part[] {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const parts: Part[] = [{ heading: "Introduction", text: "", isIntro: true }];
  let current: string[] = [];
  const flush = () => {
    parts[parts.length - 1].text = current.join("\n").trim();
    current = [];
  };
  for (const line of lines) {
    if (/^##\s+\S/.test(line) && !line.startsWith("###")) {
      flush();
      parts.push({ heading: line.replace(/^##\s+/, "").trim(), text: "", isIntro: false });
      current = [line];
    } else {
      current.push(line);
    }
  }
  flush();
  return parts;
}

export function joinParts(parts: Pick<Part, "text">[]) {
  return parts
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

/** Replaces one part (index into splitParts) and returns the new article. */
export function replacePart(body: string, index: number, text: string) {
  const parts = splitParts(body);
  if (index < 0 || index >= parts.length) return body;
  parts[index] = { ...parts[index], text: text.trim() };
  return joinParts(parts);
}

/**
 * Turns the first plain occurrence of `anchor` into a link to `path`. Skips text that is already part
 * of a link or sits in a heading. Returns ok=false when the phrase isn't there to link.
 */
export function insertLink(body: string, anchor: string, path: string): { body: string; ok: boolean } {
  if (!anchor || !isInternalPath(path)) return { body, ok: false };
  let from = 0;
  for (;;) {
    const at = body.indexOf(anchor, from);
    if (at === -1) return { body, ok: false };
    const lineStart = body.lastIndexOf("\n", at - 1) + 1;
    const lineEnd = body.indexOf("\n", at);
    const line = body.slice(lineStart, lineEnd === -1 ? body.length : lineEnd);
    const before = body.slice(lineStart, at);
    const after = body.slice(at + anchor.length);
    const inHeading = /^#{1,6}\s/.test(line);
    // Inside [label](url) if an unclosed "[" precedes it on the line, or "](" follows directly.
    const openBracket = before.lastIndexOf("[") > before.lastIndexOf("]");
    const linkTarget = after.startsWith("](");
    if (!inHeading && !openBracket && !linkTarget) {
      return { body: `${body.slice(0, at)}[${anchor}](${path})${after}`, ok: true };
    }
    from = at + anchor.length;
  }
}

export function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}
