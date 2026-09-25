// Careers content and application rules, shared by the pages, the form and the API route.

export const BENEFITS = [
  {
    icon: "training",
    title: "Continuous Training",
    description:
      "Structured onboarding and ongoing skills development, so you keep growing long after your first week.",
  },
  {
    icon: "growth",
    title: "Clear Advancement",
    description: "Transparent career paths with real progression — from entry level to leading a team.",
  },
  {
    icon: "mentor",
    title: "Mentorship",
    description: "Learn alongside experienced specialists who invest in your development and share what they know.",
  },
  {
    icon: "remote",
    title: "Remote & Sydney",
    description: "Work from our Sydney office or remotely, with the tools and support to do your best work anywhere.",
  },
  {
    icon: "wellbeing",
    title: "Wellbeing First",
    description: "Stability and genuine care for your wellbeing. You're treated as a professional, not a headset.",
  },
  {
    icon: "impact",
    title: "Meaningful Work",
    description: "Be trusted to make decisions and shape how we serve clients across HR, finance and customer care.",
  },
] as const;

export const HIRING_STEPS = [
  { title: "Apply", description: "Send your details and resume. It takes about five minutes." },
  { title: "Review", description: "Our recruitment team reviews every application personally." },
  { title: "Conversation", description: "Meet the team to talk about the role, your experience and your goals." },
  { title: "Welcome", description: "Receive your offer and start onboarding with the Hive." },
] as const;

/** Used when someone applies without choosing a specific opening. */
export const GENERAL_APPLICATION = { id: "general", title: "General Application", department: "Talent Community" };

// Resume upload rules. The 4 MB cap keeps uploads within serverless request limits (e.g. Vercel's 4.5 MB).
export const RESUME_REQUIRED = true;
export const RESUME_MAX_BYTES = 4 * 1024 * 1024;
export const RESUME_ACCEPT = ".pdf,.doc,.docx";
export const RESUME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function resumeProblem(file: { name: string; size: number }): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ext in RESUME_TYPES)) return "Please upload a PDF or Word document (.pdf, .doc, .docx).";
  if (file.size === 0) return "That file looks empty. Please choose another.";
  if (file.size > RESUME_MAX_BYTES) return "Your resume must be 4 MB or smaller.";
  return null;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Splits a requirements paragraph ("2+ years… Familiarity with…") into bullet points. */
export function splitRequirements(text: string) {
  return text
    .split(/(?<=\.)\s+(?=[A-Z0-9])/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);
}
