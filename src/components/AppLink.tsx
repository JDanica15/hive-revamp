"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ComponentProps, type MouseEvent } from "react";

// Hash navigation that matches the original react-router behaviour:
// "/#section" links scroll smoothly to the section, also when coming from another page.
let pendingHash: string | null = null;

function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, 50);
}

type AppLinkProps = ComponentProps<typeof Link> & { href: string };

export function AppLink({ href, onClick, ...props }: AppLinkProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    const hashIndex = href.indexOf("#");
    if (e.defaultPrevented || hashIndex < 0) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const targetPath = href.slice(0, hashIndex) || pathname;
    const hash = href.slice(hashIndex);
    e.preventDefault();

    if (targetPath === pathname) {
      window.history.pushState(null, "", `${targetPath}${hash}`);
      scrollToHash(hash);
    } else {
      pendingHash = hash;
      router.push(`${targetPath}${hash}`, { scroll: false });
    }
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}

/** Mounted once in the root layout: finishes cross-page hash navigation after the new page renders. */
export function HashScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (pendingHash) {
      scrollToHash(pendingHash);
      pendingHash = null;
    }
  }, [pathname]);

  return null;
}
