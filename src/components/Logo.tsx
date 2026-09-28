import { LOGO_URL, SITE_NAME } from "@/lib/site";

export function Logo({ variant = "dark", className = "" }: { variant?: "dark" | "light"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small logo, served as-is
    <img
      src={LOGO_URL}
      alt={SITE_NAME}
      className={className}
      style={variant === "light" ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
}
