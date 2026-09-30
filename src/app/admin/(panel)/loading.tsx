// Shown in place of the active tab's content while its data loads, so switching tabs feels instant.
// The header, stats and tabs come from the layout and stay on screen.
export default function AdminLoading() {
  return (
    <section aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-44 mb-6 rounded-sm bg-foreground/10 animate-pulse motion-reduce:animate-none" />
      <ul className="space-y-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <li key={i} className="bg-background border border-border rounded-sm p-5 flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="flex-1 space-y-3 animate-pulse motion-reduce:animate-none">
              <div className="flex items-center gap-3">
                <div className="h-4 w-36 rounded-sm bg-foreground/10" />
                <div className="h-4 w-12 rounded-full bg-foreground/10" />
                <div className="h-3 w-28 rounded-sm bg-foreground/5" />
              </div>
              <div className="h-3.5 w-48 rounded-sm bg-foreground/10" />
              <div className="h-3 w-64 max-w-full rounded-sm bg-foreground/5" />
              <div className="h-3 w-3/4 rounded-sm bg-foreground/5" />
            </div>
            <div className="flex gap-2 shrink-0 animate-pulse motion-reduce:animate-none">
              <div className="h-8 w-24 rounded-sm bg-foreground/10" />
              <div className="h-8 w-24 rounded-sm bg-foreground/10" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
