"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Inquiries" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/jobs", label: "Job Listings" },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <nav aria-label="Admin sections" className="flex gap-1 p-1 bg-background border border-border rounded-full w-fit mb-8 overflow-x-auto max-w-full">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={isActive(tab.href) ? "page" : undefined}
          className={
            "px-4 sm:px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors " +
            (isActive(tab.href) ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")
          }
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
