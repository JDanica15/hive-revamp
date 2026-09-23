import type { Metadata } from "next";
import { CareersHero } from "@/components/careers/CareersHero";
import { JobBoard } from "@/components/careers/JobBoard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { getOpenJobs } from "@/lib/data";
import { OG_DEFAULTS } from "@/lib/site";
import { breadcrumbJsonLd, jobListJsonLd } from "@/lib/jsonld";

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
        <CareersHero />
        <section
          className="py-16 lg:py-24 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto"
          aria-labelledby="opportunities-heading"
        >
          <div className="mb-10">
            <h2 id="opportunities-heading" className="font-heading text-3xl lg:text-4xl font-medium">
              Open Opportunities
            </h2>
            <p className="text-muted-foreground mt-3">Browse our current openings and initiate an application.</p>
          </div>
          <JobBoard jobs={jobs} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
