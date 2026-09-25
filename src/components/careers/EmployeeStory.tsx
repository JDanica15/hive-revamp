import { AppLink } from "@/components/AppLink";
import { ArrowUpRight } from "@/components/icons";
import { SmartImage } from "@/components/SmartImage";
import type { Testimonial } from "@/lib/data";

/** A featured employee testimonial, in the dark footer palette. */
export function EmployeeStory({ story }: { story: Testimonial }) {
  return (
    <section className="bg-foreground text-background" aria-label="Employee story">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 py-20 lg:py-28 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-4">
          <div className="relative aspect-[3/4] max-w-xs rounded-sm overflow-hidden">
            <SmartImage
              src={story.photo_url}
              alt={story.employee_name}
              fill
              sizes="(min-width: 1024px) 320px, 80vw"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <figure className="lg:col-span-8">
          <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-6">Life at Hive</p>
          <blockquote className="font-heading text-3xl lg:text-4xl font-medium leading-snug text-balance">
            &ldquo;{story.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-10 pt-8 border-t border-background/15 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-heading text-lg font-semibold">{story.employee_name}</p>
              <p className="text-background/60 text-sm">
                {story.role} · {story.years_at_company} years at Hive
              </p>
            </div>
            <AppLink
              href="/#testimonials"
              className="group inline-flex items-center gap-2 text-sm font-medium text-background/80 hover:text-accent transition-colors"
            >
              More stories from our people
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </AppLink>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
