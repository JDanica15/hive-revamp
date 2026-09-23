import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventGallery } from "@/components/events/EventGallery";
import { EventHero } from "@/components/events/EventHero";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowLeft } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { getEvent, getEvents } from "@/lib/data";
import { formatLongDate } from "@/lib/format";
import { imageSize } from "@/lib/images";
import { breadcrumbJsonLd, eventJsonLd } from "@/lib/jsonld";
import { OG_DEFAULTS } from "@/lib/site";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return getEvents().map((event) => ({ id: event.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const event = getEvent((await params).id);
  if (!event) return { title: "Event not found", robots: { index: false } };

  const title = `${event.title} — ${event.location ?? "Hive Events"}`;
  const description =
    event.description ?? `${event.title}, ${formatLongDate(event.date)}. Photos from life at Hive BPO.`;
  const url = `/events/${event.id}`;
  const [width, height] = imageSize(event.cover_photo_url);
  const images = [{ url: event.cover_photo_url, width, height, alt: event.title }];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...OG_DEFAULTS, type: "article", url, title: `${title} | Hive BPO`, description, images, publishedTime: event.date },
    twitter: { card: "summary_large_image", title: `${title} | Hive BPO`, description, images },
  };
}

export default async function EventPage({ params }: Params) {
  const event = getEvent((await params).id);
  if (!event) notFound();
  const photos = event.photos ?? [];

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          eventJsonLd(event),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            { name: event.title, path: `/events/${event.id}` },
          ]),
        ]}
      />
      <Header />
      <main id="main">
        <div className="pt-28 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto">
          <Link
            href="/events"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All Events
          </Link>
        </div>
        <EventHero event={event} />
        {photos.length > 0 && <EventGallery photos={photos} title={event.title} />}
      </main>
      <Footer />
    </div>
  );
}
