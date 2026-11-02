import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { HiveTeam } from "@/components/home/HiveTeam";
import { Services } from "@/components/home/Services";
import { TrustedBy } from "@/components/home/TrustedBy";
import { JsonLd } from "@/components/JsonLd";
// Video Stories section hidden — restore by uncommenting this import and <VideoStories /> below.
// import { VideoStories } from "@/components/VideoStories";
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
        {/* <VideoStories /> */}
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
