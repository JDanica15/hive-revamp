"use client";

import { useActionState } from "react";
import { requestPasswordReset, updatePassword } from "@/app/admin/actions";
import { FIELD, LABEL } from "@/components/admin/styles";
import { Check, CircleAlert, LoaderCircle } from "@/components/icons";

const BUTTON =
  "w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors";

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
      <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
      {message}
    </p>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);

  if (state?.sent) {
    return (
      <div role="status" className="flex items-start gap-3 p-4 rounded-sm bg-accent/10 text-sm">
        <Check className="w-5 h-5 text-accent shrink-0" />
        <p>
          If that email has admin access, a reset link is on its way. It expires in 1 hour. Check your spam folder if it
          doesn&apos;t arrive within a few minutes.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className={LABEL}>
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className={FIELD} />
      </div>
      <FormError message={state?.error} />
      <button type="submit" disabled={pending} className={BUTTON}>
        {pending && <LoaderCircle className="w-4 h-4 animate-spin" />}
        Send reset link
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, null);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="password" className={LABEL}>
          New password
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className={FIELD} />
      </div>
      <div>
        <label htmlFor="confirm" className={LABEL}>
          Confirm new password
        </label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} className={FIELD} />
      </div>
      <FormError message={state?.error} />
      <button type="submit" disabled={pending} className={BUTTON}>
        {pending && <LoaderCircle className="w-4 h-4 animate-spin" />}
        Save password
      </button>
    </form>
  );
}
