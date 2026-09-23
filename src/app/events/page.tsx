import type { Metadata } from "next";
import { EventsBrowser } from "@/components/events/EventsBrowser";
import { EventsIntro } from "@/components/events/EventsIntro";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { getEvents } from "@/lib/data";
import { OG_DEFAULTS } from "@/lib/site";
import { breadcrumbJsonLd, eventListJsonLd } from "@/lib/jsonld";

const TITLE = "Events — Life at Hive";
const DESCRIPTION =
  "From gala dinners to team retreats, holiday celebrations to client nights — the gatherings that shape the Hive BPO culture and bring our people together.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/events" },
  openGraph: { ...OG_DEFAULTS, url: "/events", title: `${TITLE} | Hive BPO`, description: DESCRIPTION },
  twitter: { title: `${TITLE} | Hive BPO`, description: DESCRIPTION },
};

export default function EventsPage() {
  const events = getEvents();
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
          ]),
          eventListJsonLd(events),
        ]}
      />
      <Header />
      <main id="main">
        <EventsIntro />
        <EventsBrowser events={events} />
      </main>
      <Footer />
    </div>
  );
}
