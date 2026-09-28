"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  APPLICATION_STATUSES,
  INQUIRY_PRIORITIES,
  INQUIRY_STATUSES,
  JOB_STATUSES,
  isAdminEmail,
  requireAdmin,
} from "@/lib/admin";
import { TOO_MANY, clientId, withinRateLimit } from "@/lib/request-guard";
import { authClient, db, isSupabaseConfigured } from "@/lib/supabase";
import { clean, isEmail } from "@/lib/validate";

// Every action re-checks the admin session: Server Actions are public endpoints.

export async function signIn(_prev: { error: string } | null, form: FormData) {
  if (!isSupabaseConfigured) return { error: "The admin panel isn't set up yet (Supabase environment variables are missing)." };
  const email = clean(form.get("email"), 254).toLowerCase();
  const password = typeof form.get("password") === "string" ? String(form.get("password")).slice(0, 200) : "";
  if (!email || !password) return { error: "Enter your email and password." };
  if (!isEmail(email)) return { error: "Enter a valid email address." };

  // Slows down password guessing: per visitor, and per account from any visitor.
  if (!(await withinRateLimit("login", await clientId())) || !(await withinRateLimit("loginEmail", email))) {
    return { error: TOO_MANY };
  }

  const supabase = await authClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  // Same message for a wrong password and a non-admin account, so the form doesn't reveal which accounts exist.
  if (error || !data.user || !isAdminEmail(data.user.email)) {
    if (data?.user) await supabase.auth.signOut();
    return { error: "Incorrect email or password." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await authClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

type FormState = { error?: string; sent?: boolean } | null;

/**
 * Emails a password-reset link (sent by Supabase Auth). Only admin emails get one, and the
 * reply is the same either way, so the form can't be used to discover which emails exist.
 */
export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: "The admin panel isn't set up yet (Supabase environment variables are missing)." };
  const email = clean(form.get("email"), 254).toLowerCase();
  if (!email) return { error: "Enter your email." };
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (!(await withinRateLimit("passwordReset", await clientId()))) return { error: TOO_MANY };

  if (isAdminEmail(email)) {
    const h = await headers();
    const origin = h.get("origin") ?? `https://${h.get("x-forwarded-host") ?? h.get("host")}`;
    const supabase = await authClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/admin/auth/confirm?next=/admin/reset-password`,
    });
    if (error) {
      console.error("Password reset email failed:", error);
      if (error.status === 429) return { error: "Too many reset emails were sent recently. Please wait a few minutes and try again." };
      return { error: "We couldn't send the email. Please try again." };
    }
  }
  return { sent: true };
}

/** Sets a new password for the signed-in admin (after following the reset link). */
export async function updatePassword(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password.length > 72) return { error: "Use 72 characters or fewer." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await authClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message || "We couldn't update your password." };
  redirect("/admin");
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
