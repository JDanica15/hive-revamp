import { NextResponse } from "next/server";
import { createEntity, isEmail, pickFields } from "@/lib/base44";
import { getJob } from "@/lib/data";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const data = pickFields(body, {
    job_listing_id: 64,
    applicant_name: 200,
    applicant_email: 320,
    phone: 50,
    resume_url: 1000,
    cover_note: 5000,
  });

  const job = getJob(data.job_listing_id);
  if (!job || !data.applicant_name || !data.cover_note || !isEmail(data.applicant_email)) {
    return NextResponse.json({ error: "Please complete the required fields." }, { status: 400 });
  }

  try {
    await createEntity("JobApplication", { ...data, job_title: job.title });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not submit your application." }, { status: 502 });
  }
}
