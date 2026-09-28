import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/admin/PasswordForms";
import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const admin = await requireAdmin();

  return (
    <main id="main" className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Logo className="h-8 w-auto mb-10" />
        <h1 className="font-heading text-3xl font-medium mb-2">Choose a new password</h1>
        <p className="text-muted-foreground text-sm mb-8">
          For <span className="text-foreground">{admin.email}</span>. Use at least 8 characters.
        </p>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
