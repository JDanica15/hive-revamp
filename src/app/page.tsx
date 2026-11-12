import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { HiveTeam } from "@/components/home/HiveTeam";
import { Services } from "@/components/home/Services";
import { Testimonials } from "@/components/home/Testimonials";
import { TrustedBy } from "@/components/home/TrustedBy";
import { JsonLd } from "@/components/JsonLd";
import { VideoStories } from "@/components/VideoStories";
import { getTestimonials } from "@/lib/data";
import { organizationJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Header />
      <main id="main">
        <Hero />
        <TrustedBy />
        <HiveTeam />
        <Services />
        <Testimonials testimonials={getTestimonials()} />
        <VideoStories />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
