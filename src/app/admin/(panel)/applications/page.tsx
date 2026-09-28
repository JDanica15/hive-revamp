import type { Metadata } from "next";
import { ApplicationStatusSelect } from "@/components/admin/ApplicationStatusSelect";
import { BADGE, STATUS_TONE } from "@/components/admin/styles";
import { FileText } from "@/components/icons";
import { type JobApplication, formatWhen, label, requireAdmin } from "@/lib/admin";
import { db } from "@/lib/supabase";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  await requireAdmin();
  const { data, error } = await db()
    .from("job_applications")
    .select("*")
    .order("created_date", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  const applications = data as JobApplication[];

  return (
    <section aria-labelledby="applications-heading">
      <h1 id="applications-heading" className="font-heading text-2xl font-medium mb-6">
        Applications
      </h1>
      {applications.length === 0 ? (
        <p className="text-muted-foreground py-20 text-center">No applications yet. Applications from the careers page will appear here.</p>
      ) : (
        <ul className="space-y-3">
          {applications.map((a) => (
            <li key={a.id} className="bg-background border border-border rounded-sm p-5 flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <p className="font-medium">{a.applicant_name}</p>
                  <span className={BADGE + " " + (STATUS_TONE[a.status] ?? "")}>{label(a.status)}</span>
                  <span className="text-xs text-muted-foreground">{formatWhen(a.created_date)}</span>
                </div>
                <p className="text-sm text-accent font-medium">{a.job_title}</p>
                <p className="text-sm text-muted-foreground break-words mt-1">
                  <a href={`mailto:${a.applicant_email}`} className="hover:text-accent hover:underline underline-offset-2">
                    {a.applicant_email}
                  </a>
                  {a.phone && (
                    <>
                      {" · "}
                      <a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="hover:text-accent">
                        {a.phone}
                      </a>
                    </>
                  )}
                  {a.portfolio_url && (
                    <>
                      {" · "}
                      <a
                        href={/^https?:\/\//i.test(a.portfolio_url) ? a.portfolio_url : `https://${a.portfolio_url}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="hover:text-accent hover:underline underline-offset-2"
                      >
                        Portfolio / LinkedIn
                      </a>
                    </>
                  )}
                </p>
                {a.cover_note && (
                  <details className="group mt-2">
                    <summary className="text-sm text-foreground/80 cursor-pointer list-none">
                      <span className="line-clamp-2 group-open:line-clamp-none whitespace-pre-line">{a.cover_note}</span>
                    </summary>
                  </details>
                )}
              </div>
              <div className="flex gap-2 shrink-0 items-center">
                {a.resume_path && (
                  <a
                    href={`/admin/resume/${a.id}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Resume
                  </a>
                )}
                <ApplicationStatusSelect id={a.id} status={a.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
