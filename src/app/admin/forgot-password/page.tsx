import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/admin/PasswordForms";
import { ArrowLeft } from "@/components/icons";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;

  return (
    <main id="main" className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block mb-10">
          <Logo className="h-8 w-auto" />
        </Link>
        <h1 className="font-heading text-3xl font-medium mb-2">Reset your password</h1>
        <p className="text-muted-foreground text-sm mb-8">
          {expired
            ? "That reset link has expired or was already used. Request a new one below."
            : "Enter your admin email and we'll send you a link to choose a new password."}
        </p>
        <ForgotPasswordForm />
        <Link
          href="/admin/login"
          className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
