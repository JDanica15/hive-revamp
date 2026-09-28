import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, SUPABASE_URL } from "@/lib/supabase-env";

// Supabase stores job listings, inquiries, applications and resumes, and handles the admin login.
// Set the keys in Vercel (Project → Settings → Environment Variables); see .env.example.

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && SUPABASE_SECRET_KEY);

export const RESUME_BUCKET = "resumes";

let serviceClient: SupabaseClient | null = null;

/** Full-access database client. Server code only: it bypasses Row Level Security. */
export function db(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error("Supabase is not configured: set SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }
  serviceClient ??= createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}

/** Login-session client bound to the request's cookies (admin sign-in, sign-out, current user). */
export async function authClient() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase is not configured: set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.");
  }
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only; the proxy refreshes them instead.
        }
      },
    },
  });
}
