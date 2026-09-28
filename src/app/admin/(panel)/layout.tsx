import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { ArrowLeft } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/supabase";

async function count(table: string, column: string, value: string) {
  const { count } = await db().from(table).select("id", { count: "exact", head: true }).eq(column, value);
  return count ?? 0;
}

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [newInquiries, newApplications, openJobs] = await Promise.all([
    count("inquiries", "status", "new"),
    count("job_applications", "status", "new"),
    count("job_listings", "status", "open"),
  ]);
  const stats = [
    { label: "New inquiries", value: newInquiries },
    { label: "New applications", value: newApplications },
    { label: "Open jobs", value: openJobs },
  ];

  return (
    <>
      <header className="bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/admin" aria-label="Admin home">
              <Logo className="h-7 w-auto" />
            </Link>
            <span className="hidden sm:inline text-sm text-muted-foreground border-l border-border pl-4">Command Center</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to site
            </Link>
            <span className="hidden md:inline text-muted-foreground truncate max-w-[14rem]" title={admin.email}>
              {admin.email}
            </span>
            <form action={signOut}>
              <button type="submit" className="px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main id="main" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <dl className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-background border border-border rounded-sm p-4 sm:p-5">
              <dt className="text-[11px] sm:text-xs tracking-wider uppercase text-muted-foreground">{s.label}</dt>
              <dd className="font-heading text-2xl sm:text-3xl font-semibold mt-1 tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
        <AdminNav />
        {children}
      </main>
    </>
  );
}
