import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobForm } from "@/components/admin/JobForm";
import { requireAdmin } from "@/lib/admin";
import type { JobListing } from "@/lib/data";
import { db } from "@/lib/supabase";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await db().from("job_listings").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const job = data as JobListing;

  return (
    <section aria-labelledby="edit-job-heading">
      <h1 id="edit-job-heading" className="font-heading text-2xl font-medium mb-6">
        Edit listing
      </h1>
      <JobForm job={job} />
    </section>
  );
}
