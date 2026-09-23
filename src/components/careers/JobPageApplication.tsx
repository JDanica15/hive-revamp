"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApplicationReceived, JobDetails } from "@/components/careers/JobApplication";
import type { JobListing } from "@/lib/data";

export function JobPageApplication({ job }: { job: JobListing }) {
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  return submitted ? (
    <ApplicationReceived job={job} onClose={() => router.push("/careers")} />
  ) : (
    <JobDetails job={job} headingLevel="h2" onSubmitted={() => setSubmitted(true)} />
  );
}
