// schema.org structured data for rich results.
import type { HiveEvent, JobListing } from "@/lib/data";
import { CONTACT, LOGO_URL, SERVICES, SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL, absoluteUrl } from "@/lib/site";

const ORG_ID = `${SITE_URL}/#organization`;

const postalAddress = {
  "@type": "PostalAddress",
  streetAddress: CONTACT.street,
  addressLocality: CONTACT.locality,
  addressRegion: CONTACT.region,
  postalCode: CONTACT.postalCode,
  addressCountry: CONTACT.country,
};

export function organizationJsonLd() {
  // The social links are still generic placeholders; only real profile URLs belong in sameAs.
  const profiles = [SOCIAL.linkedin, SOCIAL.facebook].filter((u) => !/^https:\/\/www\.(linkedin|facebook)\.com\/?$/.test(u));
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: "Hive Solutions Professional",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    logo: LOGO_URL,
    image: absoluteUrl("/opengraph-image"),
    email: CONTACT.email,
    telephone: CONTACT.phone.replace(/\s/g, ""),
    address: postalAddress,
    areaServed: ["AU", "Worldwide"],
    ...(profiles.length ? { sameAs: profiles } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: CONTACT.email,
      telephone: CONTACT.phone.replace(/\s/g, ""),
      areaServed: "AU",
      availableLanguage: "English",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Business process outsourcing services",
      itemListElement: SERVICES.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, description: s.description, provider: { "@id": ORG_ID } },
      })),
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "en-AU",
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

const EMPLOYMENT_TYPES: Record<string, string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Contract: "CONTRACTOR",
  Temporary: "TEMPORARY",
};

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function jobPostingJsonLd(job: JobListing) {
  const remote = /remote/i.test(job.location);
  const onsite = /sydney/i.test(job.location);
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: `<p>${job.summary}</p><h3>About the Role</h3><p>${job.description}</p><h3>Requirements</h3><p>${job.requirements}</p>`,
    identifier: { "@type": "PropertyValue", name: SITE_NAME, value: job.id },
    datePosted: job.posted_date,
    validThrough: `${addDays(job.posted_date, 90)}T23:59:59+10:00`,
    employmentType: EMPLOYMENT_TYPES[job.employment_type] ?? "OTHER",
    industry: "Business Process Outsourcing",
    occupationalCategory: job.department,
    directApply: true,
    url: absoluteUrl(`/careers/${job.id}`),
    hiringOrganization: { "@type": "Organization", "@id": ORG_ID, name: SITE_NAME, sameAs: SITE_URL, logo: LOGO_URL },
    ...(onsite || !remote ? { jobLocation: { "@type": "Place", address: postalAddress } } : {}),
    ...(remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: CONTACT.countryName },
        }
      : {}),
  };
}

export function jobListJsonLd(jobs: JobListing[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Open opportunities at Hive BPO",
    itemListElement: jobs.map((job, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/careers/${job.id}`),
      name: job.title,
    })),
  };
}

export function eventJsonLd(event: HiveEvent) {
  const images = [event.cover_photo_url, ...(event.photos ?? [])].map((src) => absoluteUrl(src));
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.date,
    endDate: event.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: Array.from(new Set(images)),
    url: absoluteUrl(`/events/${event.id}`),
    location: {
      "@type": "Place",
      name: event.location || "Sydney",
      address: {
        "@type": "PostalAddress",
        addressLocality: event.location || CONTACT.locality,
        addressCountry: CONTACT.country,
      },
    },
    organizer: { "@type": "Organization", "@id": ORG_ID, name: SITE_NAME, url: SITE_URL },
  };
}

export function eventListJsonLd(events: HiveEvent[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Life at Hive — events",
    itemListElement: events.map((event, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/events/${event.id}`),
      name: event.title,
    })),
  };
}
