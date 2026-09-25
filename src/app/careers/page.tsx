import type { Metadata } from "next";
import { CareersHero } from "@/components/careers/CareersHero";
import { EmployeeStory } from "@/components/careers/EmployeeStory";
import { HiringProcess } from "@/components/careers/HiringProcess";
import { JobBoard } from "@/components/careers/JobBoard";
import { WhyHive } from "@/components/careers/WhyHive";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { VideoStories } from "@/components/VideoStories";
import { getOpenJobs, getTestimonials } from "@/lib/data";
import { breadcrumbJsonLd, jobListJsonLd } from "@/lib/jsonld";
import { OG_DEFAULTS } from "@/lib/site";

const TITLE = "Careers — Build a Career, Not Just a Job";
const DESCRIPTION =
  "Join Hive BPO in Sydney or remotely. Open roles in HR, finance & bookkeeping, customer service, operations, technology and administration — with continuous training and clear advancement.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/careers" },
  openGraph: { ...OG_DEFAULTS, url: "/careers", title: `${TITLE} | Hive BPO`, description: DESCRIPTION },
  twitter: { title: `${TITLE} | Hive BPO`, description: DESCRIPTION },
};

export default function CareersPage() {
  const jobs = getOpenJobs();
  const story = getTestimonials().find((t) => (t.testimonial_type || "employee") === "employee");
  const stats = {
    openRoles: jobs.length,
    teams: new Set(jobs.map((j) => j.department)).size,
    types: Array.from(new Set(jobs.map((j) => j.employment_type))).sort().reverse(),
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Careers", path: "/careers" },
          ]),
          jobListJsonLd(jobs),
        ]}
      />
      <Header />
      <main id="main">
        <CareersHero stats={stats} />
        <WhyHive />
        <section
          id="open-roles"
          className="scroll-mt-24 py-20 lg:py-28 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto"
          aria-labelledby="opportunities-heading"
        >
          <div className="grid lg:grid-cols-12 gap-6 mb-12">
            <div className="lg:col-span-7">
              <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">Open Opportunities</p>
              <h2 id="opportunities-heading" className="font-heading text-4xl lg:text-5xl font-medium leading-tight">
                Find your role
              </h2>
            </div>
            <p className="lg:col-span-5 flex items-end text-muted-foreground leading-relaxed">
              Browse our current openings and apply in minutes — just bring your resume.
            </p>
          </div>
          <JobBoard jobs={jobs} />
        </section>
        <VideoStories />
        {story && <EmployeeStory story={story} />}
        <HiringProcess />
      </main>
      <Footer />
    </div>
  );
}
