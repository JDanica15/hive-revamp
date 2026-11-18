import type { Metadata } from "next";
import Link from "next/link";
import { BlogWizard } from "@/components/admin/BlogWizard";
import { ArrowLeft } from "@/components/icons";
import { requireAdmin } from "@/lib/admin";
import { GEMINI_CONFIGURED } from "@/lib/gemini";

export const metadata: Metadata = { title: "New post" };
// The strategy and article steps run Gemini inside this page's server actions.
export const maxDuration = 120;

export default async function NewPostPage() {
  await requireAdmin();
  return (
    <section aria-labelledby="new-heading" className="space-y-6">
      <div>
        <Link href="/admin/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          All posts
        </Link>
        <h1 id="new-heading" className="font-heading text-2xl font-medium">
          New post
        </h1>
      </div>
      {!GEMINI_CONFIGURED && (
        <p className="bg-amber-50 border border-amber-200 text-amber-900 rounded-sm p-4 text-sm">
          <strong>GEMINI_API_KEY isn&apos;t set.</strong> Add it to your environment variables and restart before the writer can work.
        </p>
      )}
      <BlogWizard />
    </section>
  );
}
