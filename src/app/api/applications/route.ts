import { NextResponse } from "next/server";
import { createEntity, isEmail, uploadFile } from "@/lib/base44";
import { GENERAL_APPLICATION, RESUME_REQUIRED, RESUME_TYPES, resumeProblem } from "@/lib/careers";
import { getJob } from "@/lib/data";

// Checks the file's leading bytes so a renamed executable can't pass as a resume.
function looksLikeDocument(bytes: Uint8Array, ext: string) {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (ext === "pdf") return starts(0x25, 0x50, 0x44, 0x46); // %PDF
  if (ext === "docx") return starts(0x50, 0x4b, 0x03, 0x04); // ZIP container
  if (ext === "doc") return starts(0xd0, 0xcf, 0x11, 0xe0); // OLE compound file
  return false;
}

function field(form: FormData, key: string, max: number) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Your application could not be read. If you attached a large file, try one under 4 MB.");
  }

  // Honeypot: real people never fill this hidden field.
  if (field(form, "company_website", 200)) return NextResponse.json({ ok: true }, { status: 201 });

  const jobId = field(form, "job_listing_id", 64);
  const job = jobId === GENERAL_APPLICATION.id ? GENERAL_APPLICATION : getJob(jobId);
  const data = {
    applicant_name: field(form, "applicant_name", 200),
    applicant_email: field(form, "applicant_email", 320),
    phone: field(form, "phone", 50),
    cover_note: field(form, "cover_note", 5000),
  };
  const portfolio = field(form, "portfolio_url", 500);

  if (!job) return fail("This position is no longer open.");
  if (!data.applicant_name || !data.cover_note) return fail("Please complete the required fields.");
  if (!isEmail(data.applicant_email)) return fail("Please enter a valid email address.");

  const resume = form.get("resume");
  const hasResume = resume instanceof File && resume.size > 0;
  if (!hasResume && RESUME_REQUIRED) return fail("Please attach your resume.");

  let resumeUrl = "";
  if (hasResume) {
    const problem = resumeProblem(resume);
    const ext = resume.name.split(".").pop()!.toLowerCase();
    if (problem) return fail(problem);
    const bytes = new Uint8Array(await resume.arrayBuffer());
    if (!looksLikeDocument(bytes, ext)) return fail("That file doesn't look like a valid PDF or Word document.");

    const safeName = `${data.applicant_name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "applicant"}-resume.${ext}`;
    try {
      resumeUrl = await uploadFile(new Blob([bytes], { type: RESUME_TYPES[ext] }), safeName);
    } catch (err) {
      console.error(err);
      return fail("We couldn't upload your resume. Please try again.", 502);
    }
  }

  try {
    await createEntity("JobApplication", {
      ...data,
      cover_note: portfolio ? `${data.cover_note}\n\nPortfolio / LinkedIn: ${portfolio}` : data.cover_note,
      resume_url: resumeUrl,
      job_listing_id: job.id,
      job_title: job.title,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return fail("We couldn't submit your application. Please try again.", 502);
  }
}
