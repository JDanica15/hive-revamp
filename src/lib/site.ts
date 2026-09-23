// Central site configuration: used for metadata, structured data, sitemap and content.

/** Production origin, used for canonical URLs, Open Graph and the sitemap. Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hivebpo.com").replace(/\/+$/, "");

export const SITE_NAME = "Hive BPO";
export const SITE_TITLE = "Hive BPO — Scale Through Human Intelligence";
export const SITE_DESCRIPTION =
  "Hive BPO — Strategic HR outsourcing, bookkeeping, and customer service solutions. Scale your business through human intelligence.";

export const LOGO_URL = "https://hivebpo.com/wp-content/uploads/2024/08/cropped-image00124.png";
export const HERO_VIDEO = "/media/42154-431423229_large-evpzfi.mp4";
export const PLACEHOLDER_IMAGE = "/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332_-98l26c.png";

/** Base44 backend that stores inquiries and job applications. */
export const BASE44_SERVER = process.env.BASE44_SERVER_URL || "https://hive-pro-scale.base44.app";
export const BASE44_APP_ID = process.env.BASE44_APP_ID || "6ab07b887821790aceede340";
export const ADMIN_URL = `${BASE44_SERVER}/admin`;

export const CONTACT = {
  email: "hello@hivebpo.com",
  phone: "+61 282 520 193",
  phoneHref: "tel:+61282520193",
  street: "Suite 2, Level 14, 189 Kent St",
  locality: "Sydney",
  region: "NSW",
  postalCode: "2000",
  country: "AU",
  countryName: "Australia",
};

export const SOCIAL = {
  linkedin: "https://www.linkedin.com/",
  facebook: "https://www.facebook.com/",
};

export const NAV_LINKS = [
  { label: "Services", href: "/#services" },
  { label: "Our People", href: "/#testimonials" },
  { label: "Events", href: "/events" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/#contact" },
] as const;

export const SERVICES = [
  {
    icon: "users",
    title: "HR Outsourcing",
    description:
      "Full-cycle human resources — from recruitment and onboarding to compliance and performance management. Your people operations, handled.",
  },
  {
    icon: "calculator",
    title: "Bookkeeping & Finance",
    description:
      "Accurate, timely financial records. AP/AR, reconciliation, payroll, and reporting delivered with the precision your numbers deserve.",
  },
  {
    icon: "headphones",
    title: "Customer Service",
    description:
      "Empathetic, resolution-focused support across all channels. We represent your brand with the care and professionalism your customers expect.",
  },
  {
    icon: "clipboard",
    title: "Admin Support",
    description:
      "Executive assistance, scheduling, data entry, and operational coordination. The invisible backbone that keeps your business moving.",
  },
  {
    icon: "briefcase",
    title: "Flexible Staffing",
    description:
      "Scale up or down with dedicated talent that integrates into your team. No overhead, no friction — just capacity when you need it.",
  },
  {
    icon: "shield",
    title: "Compliance & Risk",
    description:
      "Stay ahead of regulatory requirements with experts who understand Australian employment law and international compliance standards.",
  },
] as const;

/** Open Graph fields every page should carry (a page's `openGraph` replaces the root one instead of merging). */
export const OG_DEFAULTS = { siteName: SITE_NAME, locale: "en_AU", type: "website" } as const;

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
