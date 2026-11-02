import Image from "next/image";

// Clients scroll past in a marquee. Those with artwork in public/media/clients/ render as a
// logo; the rest render as a wordmark until their logo is supplied (add `logo`/`width`/`height`).
type Client = {
  name: string;
  logo?: string;
  width?: number;
  height?: number;
  href?: string;
};

const CLIENTS: Client[] = [
  { name: "GPTTU" },
  { name: "Psych2u" },
  { name: "NavAir" },
  {
    name: "MGI Entertainment",
    logo: "/media/clients/mgi-entertainment-red.svg",
    width: 74,
    height: 48,
    href: "https://www.mgientertainment.com",
  },
  { name: "Taste of AUS & NZ", logo: "/media/clients/taste-of-aus-nz.png", width: 110, height: 50 },
  { name: "Nikis" },
  { name: "Persona Care" },
  { name: "Emerging" },
  { name: "Everlab" },
  { name: "Qantas" },
  { name: "Amazon" },
];

function ClientMark({ client }: { client: Client }) {
  const mark = client.logo ? (
    <Image
      src={client.logo}
      alt={client.name}
      width={client.width ?? 110}
      height={client.height ?? 50}
      unoptimized={client.logo.endsWith(".svg")}
      className="max-h-14 w-auto h-auto object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition duration-300"
    />
  ) : (
    <span className="font-heading text-xl sm:text-2xl whitespace-nowrap text-foreground/60 hover:text-foreground transition-colors duration-300">
      {client.name}
    </span>
  );

  return client.href ? (
    <a href={client.href} target="_blank" rel="noopener noreferrer">
      {mark}
    </a>
  ) : (
    mark
  );
}

export function TrustedBy() {
  return (
    <section className="py-16 border-y border-border bg-card/50" aria-label="Clients">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24">
        <p className="text-center text-xs tracking-[0.25em] uppercase text-muted-foreground mb-10">
          Trusted by teams that demand precision
        </p>
      </div>

      <div className="marquee-viewport marquee-mask overflow-hidden">
        <div className="marquee-track flex w-max items-center">
          {/* The list twice: the first copy is the readable one, the duplicate only fills
              the gap as the track loops, so it is hidden from assistive tech. */}
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              className="flex items-center shrink-0"
              aria-hidden={copy === 1 || undefined}
            >
              {CLIENTS.map((client) => (
                <li
                  key={client.name}
                  className="flex items-center justify-center h-16 px-8 sm:px-12"
                >
                  <ClientMark client={client} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
