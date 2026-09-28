// Admin panel types, option lists and formatting, shared by server pages and client controls.

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  company: string;
  service_interest: string;
  message: string;
  status: InquiryStatus;
  priority: InquiryPriority;
  created_date: string;
};

export type JobApplication = {
  id: string;
  job_listing_id: string;
  job_title: string;
  applicant_name: string;
  applicant_email: string;
  phone: string;
  cover_note: string;
  portfolio_url: string;
  resume_path: string;
  status: ApplicationStatus;
  created_date: string;
};

export const INQUIRY_STATUSES = ["new", "in_review", "contacted", "closed"] as const;
export const INQUIRY_PRIORITIES = ["low", "medium", "high"] as const;
export const APPLICATION_STATUSES = ["new", "reviewing", "shortlisted", "rejected", "hired"] as const;
export const JOB_STATUSES = ["open", "draft", "closed"] as const;

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];
export type InquiryPriority = (typeof INQUIRY_PRIORITIES)[number];
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_DEFAULTS = {
  title: "",
  department: "Human Resources",
  location: "Remote / Sydney, AU",
  employment_type: "Full-time",
  summary: "",
  description: "",
  requirements: "",
  status: "open" as JobStatus,
};

/** Suggestions for the job form; any other value can be typed in. */
export const DEPARTMENTS = [
  "Human Resources",
  "Finance & Bookkeeping",
  "Customer Service",
  "Operations",
  "Technology",
  "Administration",
];
export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract"];
export const LOCATIONS = ["Remote / Sydney, AU", "Remote", "Sydney, AU"];

const WHEN = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short" });

/** "28 Sept 2026, 2:15 pm" in Sydney time. */
export function formatWhen(iso: string) {
  return WHEN.format(new Date(iso));
}

/** "in_review" → "In review" */
export function label(value: string) {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
