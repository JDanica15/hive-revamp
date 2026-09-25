"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApplicationForm, ApplicationReceived } from "@/components/careers/JobApplication";

export function JobPageApplication({ job }: { job: { id: string; title: string } }) {
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  return submitted ? (
    <ApplicationReceived job={job} onClose={() => router.push("/careers#open-roles")} closeLabel="Browse more roles" />
  ) : (
    <ApplicationForm job={job} onSubmitted={() => setSubmitted(true)} />
  );
}
