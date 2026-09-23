import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowLeft } from "@/components/icons";

export default function EventNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main">
        <div className="pt-28 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto">
          <Link
            href="/events"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All Events
          </Link>
        </div>
        <div className="px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto py-24 text-center">
          <p className="text-muted-foreground text-lg">Event not found.</p>
          <Link href="/events" className="text-accent hover:underline mt-4 inline-block">
            Back to all events
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
