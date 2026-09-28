// Site content. Job listings come from Supabase (manage them at /admin/jobs). jobs.json is only
// used when Supabase isn't configured, e.g. local development. Testimonials and events come
// from the JSON files here; edit them to update the site.
import "server-only";
import { db, isSupabaseConfigured } from "@/lib/supabase";
import eventsJson from "@/data/events.json";
import jobsJson from "@/data/jobs.json";
import testimonialsJson from "@/data/testimonials.json";

export type Testimonial = {
  id: string;
  testimonial_type?: "employee" | "client";
  employee_name: string;
  role: string;
  quote: string;
  photo_url: string;
  department?: string | null;
  years_at_company?: number | null;
  client_company?: string;
  client_title?: string;
  display_order: number;
};

export type HiveEvent = {
  id: string;
  title: string;
  date: string;
  category: string;
  location?: string;
  description?: string;
  cover_photo_url: string;
  photos?: string[];
  updated_date?: string;
};

export type JobListing = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  summary: string;
  description: string;
  requirements: string;
  posted_date: string;
  status: string;
  updated_date?: string;
};

export function getTestimonials(): Testimonial[] {
  return [...(testimonialsJson as Testimonial[])].sort((a, b) => a.display_order - b.display_order);
}

/** Events, newest first. */
export function getEvents(): HiveEvent[] {
  return [...(eventsJson as HiveEvent[])].sort((a, b) => b.date.localeCompare(a.date));
}

export function getEvent(id: string): HiveEvent | undefined {
  return getEvents().find((e) => e.id === id);
}

/**
 * Open job listings, most recently posted first. If Supabase errors this throws rather than
 * falling back, so Next keeps serving the last good page instead of re-showing closed jobs.
 */
export async function getOpenJobs(): Promise<JobListing[]> {
  if (!isSupabaseConfigured) {
    return (jobsJson as JobListing[])
      .filter((j) => j.status === "open")
      .sort((a, b) => b.posted_date.localeCompare(a.posted_date));
  }
  const { data, error } = await db()
    .from("job_listings")
    .select("*")
    .eq("status", "open")
    .order("posted_date", { ascending: false });
  if (error) throw new Error(`Could not load job listings: ${error.message}`);
  return data as JobListing[];
}

/** Job ids are 24 (from Base44) or 32 (new, from Supabase) letters and digits. */
export function isJobId(id: string) {
  return /^[A-Za-z0-9]{24,32}$/.test(id);
}

/** An open job by id. Malformed ids are rejected before touching the database. */
export async function getJob(id: string): Promise<JobListing | undefined> {
  if (!isJobId(id)) return undefined;
  return (await getOpenJobs()).find((j) => j.id === id);
}
