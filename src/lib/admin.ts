import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { authClient, isSupabaseConfigured } from "@/lib/supabase";

// Admin panel access. Only people whose email is listed in ADMIN_EMAILS can open /admin,
// even if someone else manages to create a Supabase account.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | undefined | null) {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}

/** The signed-in admin, or null. Verified with Supabase on every request (not just read from the cookie). */
export const getAdmin = cache(async () => {
  await connection(); // always per-request: admin pages must never be prerendered or cached
  if (!isSupabaseConfigured) return null;
  const supabase = await authClient();
  const { data } = await supabase.auth.getUser();
  return data.user && isAdminEmail(data.user.email) ? data.user : null;
});

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export * from "@/lib/admin-shared";
