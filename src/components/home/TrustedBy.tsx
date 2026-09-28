import Image from "next/image";

// Client logos live in public/media/clients/. Update `name` when the real client names are known.
const CLIENTS = [
  { name: "Talk", logo: "/media/clients/client-1.png", width: 69, height: 67 },
  { name: "Community", logo: "/media/clients/client-2.png", width: 66, height: 66 },
  { name: "Financial Advisors", logo: "/media/clients/client-3.png", width: 120, height: 82 },
  { name: "Consult", logo: "/media/clients/client-4.png", width: 115, height: 51 },
  { name: "Dolore", logo: "/media/clients/client-5.png", width: 137, height: 35 },
  { name: "M", logo: "/media/clients/client-6.png", width: 81, height: 45 },
  {
    name: "MGI Entertainment",
    logo: "/media/clients/mgi-entertainment-red.svg",
    width: 74,
    height: 48,
    href: "https://www.mgientertainment.com",
  },
  { name: "Taste of AUS & NZ", logo: "/media/clients/taste-of-aus-nz.png", width: 110, height: 50 },
];

export function TrustedBy() {
  return (
    <section className="py-16 border-y border-border bg-card/50" aria-label="Clients">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24">
        <p className="text-center text-xs tracking-[0.25em] uppercase text-muted-foreground mb-10">
          Trusted by teams that demand precision
        </p>
        <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 items-center gap-x-6 gap-y-8">
          {CLIENTS.map((client) => {
            const logo = (
              <Image
                src={client.logo}
                alt={client.name}
                width={client.width}
                height={client.height}
                unoptimized={client.logo.endsWith(".svg")}
                className="max-h-14 max-w-full w-auto h-auto object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition duration-300"
              />
            );
            return (
              <li key={client.logo} className="flex items-center justify-center h-16">
                {"href" in client ? (
                  <a href={client.href} target="_blank" rel="noopener noreferrer">
                    {logo}
                  </a>
                ) : (
                  logo
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
