import "server-only";
import { db } from "@/lib/supabase";

export type BlogSettings = { company_brief: string; hive_post_every: number };

export const MIGRATION_HINT = "Run supabase/migrations/005_blog_facts.sql in the Supabase SQL editor, then try again.";

/** The one settings row. Throws a clear message if migration 005 hasn't been run. */
export async function getBlogSettings(): Promise<BlogSettings> {
  const { data, error } = await db().from("blog_settings").select("company_brief, hive_post_every").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Blog settings aren't available. ${MIGRATION_HINT} (${error.message})`);
  return (data as BlogSettings | null) ?? { company_brief: "", hive_post_every: 3 };
}
