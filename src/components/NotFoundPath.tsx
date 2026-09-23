"use client";

import { usePathname } from "next/navigation";

/** The requested path without its leading slash, as shown on the original 404 page. */
export function NotFoundPath() {
  return <>{usePathname().substring(1)}</>;
}
