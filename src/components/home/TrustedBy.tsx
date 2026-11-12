import Image from "next/image";

// Clients scroll past in a marquee. Those with artwork in public/media/clients/ render as a
// logo; the rest render as a wordmark until their logo is supplied (add `logo`/`width`/`height`).
type Client = {
  name: string;
  logo?: string;
  width?: number;
  height?: number;
  /** Tall, narrow logos get a taller box so they don't look tiny next to wide wordmarks. */
  tall?: boolean;
  href?: string;
};

const CLIENTS: Client[] = [
  {
    name: "GP2U",
    logo: "/media/clients/gp2u.png",
    width: 85,
    height: 34,
    href: "https://gp2u.com.au",
  },
  {
    name: "Psych2u",
    logo: "/media/clients/psych2u.png",
    width: 271,
    height: 50,
    href: "https://psych2u.com.au",
  },
  {
    name: "My Emergency Doctor",
    logo: "/media/clients/myed.svg",
    width: 152,
    height: 49,
    href: "https://www.myemergencydr.com",
  },
  {
    name: "Navair",
    logo: "/media/clients/navair.png",
    width: 240,
    height: 35,
    href: "https://www.navair.com.au",
  },
  {
    name: "MGI Entertainment",
    logo: "/media/clients/mgi-entertainment-red.svg",
    width: 74,
    height: 48,
    href: "https://www.mgientertainment.com",
  },
  {
    name: "Taste of AUS & NZ",
    logo: "/media/clients/taste-of-aus-nz.png",
    width: 110,
    height: 50,
  },
  {
    name: "Nikis",
    logo: "/media/clients/nikis_logo.avif",
    width: 43,
    height: 56,
    tall: true,
  },
  { name: "Persona Care" },
  { name: "Emerging" },
  {
    name: "Everlab",
    logo: "/media/clients/everlab.svg",
    width: 167,
    height: 33,
    href: "https://www.everlab.com.au",
  },
  { name: "Qantas", logo: "/media/clients/qantas.svg", width: 48, height: 48 },
  { name: "Amazon", logo: "/media/clients/amazon.svg", width: 302, height: 91 },
];

// Clients without a logo yet are hidden; they reappear once a `logo` is added to their entry above.
const VISIBLE_CLIENTS = CLIENTS.filter((client) => client.logo);

function ClientMark({ client }: { client: Client }) {
  // Every logo sits in the same box (object-contain keeps its proportions), so the row has even
  // spacing and each mark gets a similar visual weight whatever its natural size.
  const mark = client.logo ? (
    <span className={`block w-36 sm:w-40 ${client.tall ? "h-24 sm:h-28" : "h-16 sm:h-20"}`}>
      <Image
        src={client.logo}
        alt={client.name}
        width={320}
        height={160}
        unoptimized={client.logo.endsWith(".svg")}
        className="w-full h-full object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition duration-300"
      />
    </span>
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
    <section
      className="py-16 border-y border-border bg-card/50"
      aria-label="Clients"
    >
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
              {VISIBLE_CLIENTS.map((client) => (
                <li
                  key={client.name}
                  className="flex items-center justify-center px-4 sm:px-6"
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
