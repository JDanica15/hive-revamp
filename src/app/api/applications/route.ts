import { NextResponse } from "next/server";
import { GENERAL_APPLICATION, RESUME_MAX_BYTES, RESUME_REQUIRED, RESUME_TYPES, resumeProblem } from "@/lib/careers";
import { getJob } from "@/lib/data";
import { TOO_MANY, clientId, isCrossSite, isTooLarge, withinRateLimit } from "@/lib/request-guard";
import { RESUME_BUCKET, db } from "@/lib/supabase";
import { cleanApplication, clean, normalizeUrl, validateApplication, type FieldErrors } from "@/lib/validate";

// Resume plus form fields; anything bigger is rejected before the body is read.
const MAX_BODY_BYTES = RESUME_MAX_BYTES + 64 * 1024;

const latin1 = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);
const utf16 = (text: string) => text.split("").join("\u0000");

/**
 * Checks what the file really is (not just its extension) and refuses documents that can run
 * code when a recruiter opens them: PDFs with JavaScript or launch actions, and Word files with macros.
 */
function documentProblem(bytes: Uint8Array, ext: string): string | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  const text = latin1(bytes);
  const invalid = "That file doesn't look like a valid PDF or Word document.";
  const active = "That file contains macros or scripts, which we can't accept. Please save it as a plain PDF and try again.";

  if (ext === "pdf") {
    if (!starts(0x25, 0x50, 0x44, 0x46)) return invalid; // %PDF
    if (/\/(JavaScript|JS|Launch|EmbeddedFile|RichMedia)\b/.test(text)) return active;
    return null;
  }
  if (ext === "docx") {
    if (!starts(0x50, 0x4b, 0x03, 0x04) || !text.includes("word/document.xml")) return invalid; // ZIP with a Word body
    if (/vbaProject\.bin|vbaData\.xml|activeX/i.test(text)) return active;
    return null;
  }
  if (ext === "doc") {
    if (!starts(0xd0, 0xcf, 0x11, 0xe0)) return invalid; // OLE compound file
    if (text.includes(utf16("_VBA_PROJECT")) || text.includes(utf16("Macros"))) return active;
    return null;
  }
  return invalid;
}

function fail(error: string, status = 400, errors?: FieldErrors) {
  return NextResponse.json(errors ? { error, errors } : { error }, { status });
}

export async function POST(request: Request) {
  if (isCrossSite(request)) return fail("Forbidden", 403);
  if (isTooLarge(request, MAX_BODY_BYTES)) return fail("Your resume must be 4 MB or smaller.", 413, { resume: "Your resume must be 4 MB or smaller." });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Your application could not be read. If you attached a large file, try one under 4 MB.");
  }
  const input = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));

  // Honeypot: real people never fill this hidden field. Pretend it worked.
  if (clean(input.company_website, 200)) return NextResponse.json({ ok: true }, { status: 201 });

  const data = cleanApplication(input);
  const errors: FieldErrors = validateApplication(data);
  const resume = form.get("resume");
  const hasResume = resume instanceof File && resume.size > 0;
  if (!hasResume && RESUME_REQUIRED) errors.resume = "Please attach your resume.";
  if (hasResume) {
    const problem = resumeProblem(resume);
    if (problem) errors.resume = problem;
  }
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", 400, errors);

  const jobId = clean(input.job_listing_id, 64);
  const job = jobId === GENERAL_APPLICATION.id ? GENERAL_APPLICATION : /^[A-Za-z0-9-]{1,64}$/.test(jobId) ? await getJob(jobId) : undefined;
  if (!job) return fail("This position is no longer open.");

  if (!(await withinRateLimit("application", await clientId()))) return fail(TOO_MANY, 429);

  // Resumes go to the private "resumes" bucket; the admin panel opens them via short-lived signed links.
  let resumePath = "";
  if (hasResume) {
    const ext = resume.name.split(".").pop()!.toLowerCase();
    const bytes = new Uint8Array(await resume.arrayBuffer());
    const problem = documentProblem(bytes, ext);
    if (problem) return fail(problem, 400, { resume: problem });

    const safeName = `${data.applicant_name.normalize("NFKD").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "applicant"}-resume.${ext}`;
    resumePath = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}/${safeName}`;
    const { error } = await db().storage.from(RESUME_BUCKET).upload(resumePath, bytes, { contentType: RESUME_TYPES[ext] });
    if (error) {
      console.error("Resume upload failed:", error);
      return fail("We couldn't upload your resume. Please try again.", 502);
    }
  }

  try {
    const { error } = await db()
      .from("job_applications")
      .insert({
        ...data,
        portfolio_url: normalizeUrl(data.portfolio_url),
        resume_path: resumePath,
        job_listing_id: job.id,
        job_title: job.title,
      });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Application insert failed:", err);
    if (resumePath) await db().storage.from(RESUME_BUCKET).remove([resumePath]);
    return fail("We couldn't submit your application. Please try again.", 502);
  }
}
