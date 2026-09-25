import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobMeta, JobOverview } from "@/components/careers/JobOverview";
import { JobPageApplication } from "@/components/careers/JobPageApplication";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowLeft, ArrowUpRight } from "@/components/icons";
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
  const others = getOpenJobs().filter((j) => j.id !== job.id);
  const related = [...others.filter((j) => j.department === job.department), ...others.filter((j) => j.department !== job.department)].slice(0, 3);

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
            href="/careers#open-roles"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All Opportunities
          </Link>
        </div>

        <div className="px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto pt-10 pb-20 lg:pb-28 grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <article className="lg:col-span-7">
            <header className="mb-10 pb-10 border-b border-border">
              <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">{job.department}</p>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.02] text-balance">
                {job.title}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{job.summary}</p>
              <JobMeta job={job} className="mt-8" />
            </header>
            <JobOverview job={job} headingLevel="h2" />
          </article>

          <aside className="lg:col-span-5 lg:sticky lg:top-28" aria-labelledby="apply-heading">
            <div className="border border-border rounded-sm bg-card p-6 sm:p-8">
              <h2 id="apply-heading" className="font-heading text-2xl font-medium">
                Apply for this role
              </h2>
              <p className="text-sm text-muted-foreground mt-2 mb-8">Takes about five minutes. Have your resume ready.</p>
              <JobPageApplication job={{ id: job.id, title: job.title }} />
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto pb-24 lg:pb-32" aria-labelledby="more-roles-heading">
            <h2 id="more-roles-heading" className="font-heading text-3xl font-medium mb-8">
              More open roles
            </h2>
            <ul className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-sm overflow-hidden">
              {related.map((r) => (
                <li key={r.id}>
                  <Link href={`/careers/${r.id}`} className="group flex flex-col h-full bg-background p-6 lg:p-8 hover:bg-card transition-colors">
                    <span className="text-xs tracking-wider uppercase text-accent font-medium">{r.department}</span>
                    <span className="font-heading text-xl font-medium mt-2 group-hover:text-accent transition-colors">
                      {r.title}
                    </span>
                    <span className="text-sm text-muted-foreground mt-2 flex-1">{r.location} · {r.employment_type}</span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium mt-6">
                      View role
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
