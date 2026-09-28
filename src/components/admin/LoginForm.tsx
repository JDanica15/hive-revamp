"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/admin/actions";
import { CircleAlert, LoaderCircle } from "@/components/icons";
import { FIELD, LABEL } from "@/components/admin/styles";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className={LABEL}>
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className={FIELD} />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className={LABEL}>
            Password
          </label>
          <Link href="/admin/forgot-password" className="text-xs text-muted-foreground hover:text-accent mb-2">
            Forgot password?
          </Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={FIELD} />
      </div>
      {state?.error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors"
      >
        {pending && <LoaderCircle className="w-4 h-4 animate-spin" />}
        Sign in
      </button>
    </form>
  );
}
