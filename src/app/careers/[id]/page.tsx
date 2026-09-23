import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobPageApplication } from "@/components/careers/JobPageApplication";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowLeft } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { getJob, getOpenJobs } from "@/lib/data";
import { breadcrumbJsonLd, jobPostingJsonLd } from "@/lib/jsonld";
import { OG_DEFAULTS } from "@/lib/site";

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getOpenJobs().map((job) => ({ id: job.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const job = getJob((await params).id);
  if (!job) return {};
  const title = `${job.title} — ${job.department} Job (${job.location})`;
  const description = `${job.summary} ${job.employment_type} role at Hive BPO. Apply online today.`;
  const url = `/careers/${job.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...OG_DEFAULTS, url, title: `${title} | Hive BPO`, description },
    twitter: { title: `${title} | Hive BPO`, description },
  };
}

export default async function JobPage({ params }: Params) {
  const job = getJob((await params).id);
  if (!job) notFound();

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          jobPostingJsonLd(job),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Careers", path: "/careers" },
            { name: job.title, path: `/careers/${job.id}` },
          ]),
        ]}
      />
      <Header />
      <main id="main">
        <div className="pt-28 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto">
          <Link
            href="/careers"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All Opportunities
          </Link>
        </div>
        <article className="px-6 sm:px-12 lg:px-24 max-w-3xl mx-auto pt-8 pb-24 lg:pb-32">
          <header className="px-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs tracking-wider uppercase text-accent font-medium">{job.department}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{job.employment_type}</span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-medium leading-tight">{job.title}</h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{job.summary}</p>
          </header>
          <div className="mt-4">
            <JobPageApplication job={job} />
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
