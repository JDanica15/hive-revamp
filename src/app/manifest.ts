import type { MetadataRoute } from "next";

// Same values as the original manifest.json, with the start URL pointing at this site.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hive Solutions Professional",
    short_name: "Hive Solutions Professional",
    description:
      "A refined, professional business process outsourcing portal featuring streamlined service showcases and verified client testimonials.",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#000000",
    background_color: "#ffffff",
  };
}
