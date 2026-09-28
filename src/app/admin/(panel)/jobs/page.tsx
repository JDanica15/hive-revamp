import type { Metadata } from "next";
import Link from "next/link";
import { JobRowActions } from "@/components/admin/JobRowActions";
import { BADGE, STATUS_TONE } from "@/components/admin/styles";
import { ArrowUpRight, Plus } from "@/components/icons";
import { label, requireAdmin } from "@/lib/admin";
import type { JobListing } from "@/lib/data";
import { formatShortDate } from "@/lib/format";
import { db } from "@/lib/supabase";

export const metadata: Metadata = { title: "Job Listings" };

export default async function JobsPage() {
  await requireAdmin();
  const { data, error } = await db().from("job_listings").select("*").order("posted_date", { ascending: false });
  if (error) throw new Error(error.message);
  const jobs = data as JobListing[];

  return (
    <section aria-labelledby="jobs-heading">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 id="jobs-heading" className="font-heading text-2xl font-medium">
          Job Listings
        </h1>
        <Link
          href="/admin/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New listing
        </Link>
      </div>
      {jobs.length === 0 ? (
        <p className="text-muted-foreground py-20 text-center">No job listings yet.</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id} className="bg-background border border-border rounded-sm p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <Link href={`/admin/jobs/${job.id}`} className="font-medium hover:text-accent">
                    {job.title}
                  </Link>
                  <span className={BADGE + " " + (STATUS_TONE[job.status] ?? "")}>{label(job.status)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {job.department} · {job.location} · {job.employment_type} · Posted {formatShortDate(job.posted_date)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {job.status === "open" && (
                  <Link
                    href={`/careers/${job.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    View
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                )}
                <JobRowActions id={job.id} title={job.title} status={job.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
