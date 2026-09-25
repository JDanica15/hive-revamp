import { Briefcase, Check, Clock, MapPin } from "@/components/icons";
import { splitRequirements } from "@/lib/careers";
import type { JobListing } from "@/lib/data";
import { formatShortDate } from "@/lib/format";

export function JobMeta({ job, className = "" }: { job: JobListing; className?: string }) {
  return (
    <ul className={"flex flex-wrap gap-2 text-sm text-muted-foreground " + className}>
      <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
        <MapPin className="w-3.5 h-3.5" /> {job.location}
      </li>
      <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
        <Briefcase className="w-3.5 h-3.5" /> {job.employment_type}
      </li>
      <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
        <Clock className="w-3.5 h-3.5" /> Posted <time dateTime={job.posted_date}>{formatShortDate(job.posted_date)}</time>
      </li>
    </ul>
  );
}

/** "About the role" + "What you'll bring" for a listing. */
export function JobOverview({ job, headingLevel = "h3" }: { job: JobListing; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <div className="space-y-8">
      <section>
        <Heading className="font-heading text-xl font-medium mb-3">About the role</Heading>
        <p className="text-foreground/90 leading-relaxed">{job.description}</p>
      </section>
      <section>
        <Heading className="font-heading text-xl font-medium mb-4">What you&apos;ll bring</Heading>
        <ul className="space-y-3">
          {splitRequirements(job.requirements).map((item) => (
            <li key={item} className="flex items-start gap-3 text-foreground/90 leading-relaxed">
              <span className="mt-1 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-accent" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
