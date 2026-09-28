import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/Logo";
import { getAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");

  return (
    <main id="main" className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block mb-10">
          <Logo className="h-8 w-auto" />
        </Link>
        <h1 className="font-heading text-3xl font-medium mb-2">Hive Command Center</h1>
        <p className="text-muted-foreground text-sm mb-8">Sign in to manage inquiries, applications and job listings.</p>
        <LoginForm />
      </div>
    </main>
  );
}
