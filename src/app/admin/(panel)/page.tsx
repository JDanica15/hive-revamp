import type { Metadata } from "next";
import { InquiryControls } from "@/components/admin/InquiryControls";
import { BADGE, PRIORITY_DOT, STATUS_TONE } from "@/components/admin/styles";
import { type Inquiry, formatWhen, label, requireAdmin } from "@/lib/admin";
import { db } from "@/lib/supabase";

export const metadata: Metadata = { title: "Inquiries" };

export default async function InquiriesPage() {
  await requireAdmin();
  const { data, error } = await db().from("inquiries").select("*").order("created_date", { ascending: false }).limit(300);
  if (error) throw new Error(error.message);
  const inquiries = data as Inquiry[];

  return (
    <section aria-labelledby="inquiries-heading">
      <h1 id="inquiries-heading" className="font-heading text-2xl font-medium mb-6">
        Inquiries
      </h1>
      {inquiries.length === 0 ? (
        <p className="text-muted-foreground py-20 text-center">No inquiries yet. Messages from the contact form will appear here.</p>
      ) : (
        <ul className="space-y-3">
          {inquiries.map((q) => (
            <li key={q.id} className="bg-background border border-border rounded-sm p-5 flex flex-col lg:flex-row lg:items-start gap-4">
              <span
                className={"hidden lg:block w-2 h-2 rounded-full mt-2 shrink-0 " + (PRIORITY_DOT[q.priority] ?? "bg-zinc-400")}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <p className="font-medium">{q.name}</p>
                  <span className={BADGE + " " + (STATUS_TONE[q.status] ?? "")}>{label(q.status)}</span>
                  <span className="text-xs text-muted-foreground">{formatWhen(q.created_date)}</span>
                </div>
                <p className="text-sm text-muted-foreground break-words">
                  <a href={`mailto:${q.email}`} className="hover:text-accent underline-offset-2 hover:underline">
                    {q.email}
                  </a>
                  {q.company && ` · ${q.company}`} · {q.service_interest}
                </p>
                <details className="group mt-2">
                  <summary className="text-sm text-foreground/80 cursor-pointer list-none">
                    <span className="line-clamp-2 group-open:line-clamp-none whitespace-pre-line">{q.message}</span>
                  </summary>
                </details>
              </div>
              <InquiryControls id={q.id} status={q.status} priority={q.priority} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
