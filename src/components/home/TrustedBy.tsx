const CLIENTS = ["Nexora", "Vertex", "Lumen", "Asteria", "Quanta", "Helix"];

export function TrustedBy() {
  return (
    <section className="py-16 border-y border-border bg-card/50" aria-label="Clients">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24">
        <p className="text-center text-xs tracking-[0.25em] uppercase text-muted-foreground mb-10">
          Trusted by teams that demand precision
        </p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {CLIENTS.map((name) => (
            <li key={name} className="flex items-center justify-center">
              <span className="font-heading text-xl font-medium text-muted-foreground/60 hover:text-foreground transition-colors duration-300">
                {name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
