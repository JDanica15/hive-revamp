// Site content. These JSON files are a snapshot of the Base44 entities
// (Testimonial, Event, JobListing); edit them to update the site.
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

/** Open job listings, most recently posted first. */
export function getOpenJobs(): JobListing[] {
  return (jobsJson as JobListing[])
    .filter((j) => j.status === "open")
    .sort((a, b) => b.posted_date.localeCompare(a.posted_date));
}

export function getJob(id: string): JobListing | undefined {
  return getOpenJobs().find((j) => j.id === id);
}
