import type { Metadata } from "next";
import { JobForm } from "@/components/admin/JobForm";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "New listing" };

export default async function NewJobPage() {
  await requireAdmin();
  return (
    <section aria-labelledby="new-job-heading">
      <h1 id="new-job-heading" className="font-heading text-2xl font-medium mb-6">
        New listing
      </h1>
      <JobForm />
    </section>
  );
}
