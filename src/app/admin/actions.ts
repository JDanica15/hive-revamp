"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  APPLICATION_STATUSES,
  INQUIRY_PRIORITIES,
  INQUIRY_STATUSES,
  JOB_STATUSES,
  isAdminEmail,
  requireAdmin,
} from "@/lib/admin";
import { authClient, db, isSupabaseConfigured } from "@/lib/supabase";

// Every action re-checks the admin session: Server Actions are public endpoints.

export async function signIn(_prev: { error: string } | null, form: FormData) {
  if (!isSupabaseConfigured) return { error: "The admin panel isn't set up yet (Supabase environment variables are missing)." };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await authClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Incorrect email or password." };
  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await authClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/** Refreshes every public page that lists jobs, so admin changes show immediately. */
function refreshJobPages(id?: string) {
  revalidatePath("/careers");
  revalidatePath("/sitemap.xml");
  if (id) revalidatePath(`/careers/${id}`);
  revalidatePath("/admin", "layout");
}

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

export async function saveJob(form: FormData) {
  await requireAdmin();
  const id = text(form, "id", 64);
  const status = text(form, "status", 10);
  const postedDate = text(form, "posted_date", 10);
  const job = {
    title: text(form, "title", 200),
    department: text(form, "department", 100),
    location: text(form, "location", 100),
    employment_type: text(form, "employment_type", 50),
    summary: text(form, "summary", 500),
    description: text(form, "description", 10000),
    requirements: text(form, "requirements", 5000),
    status: (JOB_STATUSES as readonly string[]).includes(status) ? status : "draft",
    posted_date: /^\d{4}-\d{2}-\d{2}$/.test(postedDate) ? postedDate : new Date().toISOString().slice(0, 10),
  };
  if (!job.title || !job.department || !job.location || !job.employment_type) {
    throw new Error("Title, department, location and type are required.");
  }

  const query = id ? db().from("job_listings").update(job).eq("id", id) : db().from("job_listings").insert(job);
  const { error } = await query;
  if (error) throw new Error(`Could not save the job: ${error.message}`);
  refreshJobPages(id || undefined);
  redirect("/admin/jobs");
}

export async function setJobStatus(id: string, status: string) {
  await requireAdmin();
  if (!(JOB_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid status");
  const { error } = await db().from("job_listings").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  refreshJobPages(id);
}

export async function deleteJob(id: string) {
  await requireAdmin();
  const { error } = await db().from("job_listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refreshJobPages(id);
}

export async function updateInquiry(id: string, patch: { status?: string; priority?: string }) {
  await requireAdmin();
  const update: Record<string, string> = {};
  if (patch.status && (INQUIRY_STATUSES as readonly string[]).includes(patch.status)) update.status = patch.status;
  if (patch.priority && (INQUIRY_PRIORITIES as readonly string[]).includes(patch.priority)) update.priority = patch.priority;
  if (!Object.keys(update).length) return;
  const { error } = await db().from("inquiries").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin", "layout");
}

export async function updateApplicationStatus(id: string, status: string) {
  await requireAdmin();
  if (!(APPLICATION_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid status");
  const { error } = await db().from("job_applications").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin", "layout");
}
