import { LOGO_URL, SITE_NAME } from "@/lib/site";

export function Logo({ variant = "dark", className = "" }: { variant?: "dark" | "light"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote logo is served as-is, like the original site
    <img
      src={LOGO_URL}
      alt={SITE_NAME}
      className={className}
      style={variant === "light" ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
}
