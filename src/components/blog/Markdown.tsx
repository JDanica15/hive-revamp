import type { ReactNode } from "react";

// Renders the blog's simple Markdown (## headings, lists, **bold**, *italic*, [links](https://...)).
// It builds React elements instead of injecting HTML, so post text can never add scripts or markup.

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = `${keyBase}-${i++}`;
    if (match[1]) out.push(<strong key={key}>{match[1]}</strong>);
    else if (match[2]) out.push(<em key={key}>{match[2]}</em>);
    else
      out.push(
        <a key={key} href={match[4]} target="_blank" rel="noopener noreferrer nofollow" className="text-accent underline underline-offset-2 hover:no-underline">
          {match[3]}
        </a>,
      );
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  let n = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const key = `b${n++}`;
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      // The page title is the only h1; "#" in the body becomes an h2.
      const level = Math.min(Math.max(heading[1].length, 2), 3);
      const text = inline(heading[2], key);
      blocks.push(
        level === 2 ? (
          <h2 key={key} className="font-heading text-2xl lg:text-3xl font-medium mt-12 mb-4 text-balance">
            {text}
          </h2>
        ) : (
          <h3 key={key} className="font-heading text-xl font-medium mt-8 mb-3 text-balance">
            {text}
          </h3>
        ),
      );
      i += 1;
      continue;
    }
    const bullet = /^\s*[-*]\s+/.test(line);
    const numbered = /^\s*\d+[.)]\s+/.test(line);
    if (bullet || numbered) {
      const items: string[] = [];
      const re = bullet ? /^\s*[-*]\s+(.*)$/ : /^\s*\d+[.)]\s+(.*)$/;
      while (i < lines.length && re.test(lines[i])) {
        items.push(re.exec(lines[i])![1]);
        i += 1;
      }
      const children = items.map((item, j) => <li key={j}>{inline(item, `${key}-${j}`)}</li>);
      blocks.push(
        bullet ? (
          <ul key={key} className="list-disc pl-6 space-y-2 my-5 marker:text-accent">
            {children}
          </ul>
        ) : (
          <ol key={key} className="list-decimal pl-6 space-y-2 my-5 marker:text-accent">
            {children}
          </ol>
        ),
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*[-*]\s|\s*\d+[.)]\s)/.test(lines[i])) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push(
      <p key={key} className="my-5">
        {inline(para.join(" "), key)}
      </p>,
    );
  }

  return <div className="text-lg leading-relaxed text-foreground/90">{blocks}</div>;
}
