import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin";
import { RESUME_BUCKET, db } from "@/lib/supabase";

// Opens an applicant's resume. Resumes are private, so this checks the admin login and
// redirects to a signed link that expires after a minute.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return NextResponse.redirect(new URL("/admin/login", request.url));

  const { id } = await params;
  const { data: application } = await db().from("job_applications").select("resume_path").eq("id", id).maybeSingle();
  if (!application?.resume_path) return new NextResponse("Resume not found", { status: 404 });

  const { data, error } = await db().storage.from(RESUME_BUCKET).createSignedUrl(application.resume_path, 60);
  if (error || !data) return new NextResponse("Could not open the resume", { status: 502 });
  return NextResponse.redirect(data.signedUrl);
}
