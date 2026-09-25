import type { MetadataRoute } from "next";
import { getEvents, getOpenJobs } from "@/lib/data";
import { ALBUMS } from "@/lib/gallery";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const events = getEvents();
  const jobs = getOpenJobs();
  const latest = (dates: (string | undefined)[]) =>
    dates.filter(Boolean).sort().at(-1)?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  return [
    { url: absoluteUrl("/"), lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    {
      url: absoluteUrl("/careers"),
      lastModified: latest(jobs.map((j) => j.updated_date ?? j.posted_date)),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...jobs.map((job) => ({
      url: absoluteUrl(`/careers/${job.id}`),
      lastModified: (job.updated_date ?? job.posted_date).slice(0, 10),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    {
      url: absoluteUrl("/events"),
      lastModified: latest(events.map((e) => e.updated_date ?? e.date)),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/gallery"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
      images: ALBUMS.flatMap((album) => album.photos).map((src) => absoluteUrl(src)),
    },
    ...events.map((event) => ({
      url: absoluteUrl(`/events/${event.id}`),
      lastModified: (event.updated_date ?? event.date).slice(0, 10),
      changeFrequency: "yearly" as const,
      priority: 0.6,
      images: [event.cover_photo_url, ...(event.photos ?? [])]
        .filter((src, i, all) => all.indexOf(src) === i)
        .map((src) => absoluteUrl(src)),
    })),
  ];
}
