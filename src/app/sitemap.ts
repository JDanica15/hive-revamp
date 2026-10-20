import type { MetadataRoute } from "next";
import { getOpenJobs } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getOpenJobs();
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
  ];
}
