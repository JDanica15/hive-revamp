import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { GalleryBrowser } from "@/components/gallery/GalleryBrowser";
import { GalleryIntro } from "@/components/gallery/GalleryIntro";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { ALBUMS } from "@/lib/gallery";
import { imageSize } from "@/lib/images";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { OG_DEFAULTS } from "@/lib/site";

const TITLE = "Gallery — The Faces Behind Hive";
const DESCRIPTION =
  "Photos from team nights, client visits and everyday moments with the Hive BPO team.";
const COVER = ALBUMS[0].photos[0];
const [coverWidth, coverHeight] = imageSize(COVER);
const IMAGES = [{ url: COVER, width: coverWidth, height: coverHeight, alt: ALBUMS[0].title }];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/gallery" },
  openGraph: { ...OG_DEFAULTS, url: "/gallery", title: `${TITLE} | Hive BPO`, description: DESCRIPTION, images: IMAGES },
  twitter: { card: "summary_large_image", title: `${TITLE} | Hive BPO`, description: DESCRIPTION, images: IMAGES },
};

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Gallery", path: "/gallery" },
          ]),
        ]}
      />
      <Header />
      <main id="main">
        <GalleryIntro />
        <GalleryBrowser albums={ALBUMS} />
      </main>
      <Footer />
    </div>
  );
}
