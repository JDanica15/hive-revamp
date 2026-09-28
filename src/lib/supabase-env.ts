// Supabase settings. Accepts Supabase's current key names (publishable / secret) as shown in
// the dashboard's "Connect" dialog, and the older names (anon / service_role).
// Kept free of imports so the proxy can use it too.

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Public key: only used for the admin login session. */
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Full-access key. Server only: never give it a NEXT_PUBLIC_ name. */
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
