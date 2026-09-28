"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "@/components/icons";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors"
    >
      {pending && <LoaderCircle className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
