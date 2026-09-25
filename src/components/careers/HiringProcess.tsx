import { HIRING_STEPS } from "@/lib/careers";

export function HiringProcess() {
  return (
    <section className="py-20 lg:py-28 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto" aria-labelledby="process-heading">
      <div className="max-w-2xl mb-14">
        <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">How We Hire</p>
        <h2 id="process-heading" className="font-heading text-4xl lg:text-5xl font-medium text-balance leading-tight">
          A simple, human process
        </h2>
      </div>
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
        {HIRING_STEPS.map((step, i) => (
          <li key={step.title} className="relative pt-8 border-t border-border">
            <span className="absolute -top-px left-0 w-12 h-px bg-accent" />
            <p className="font-heading text-4xl font-medium text-accent/40 tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="font-heading text-2xl font-medium mt-4 mb-2">{step.title}</h3>
            <p className="text-muted-foreground text-[15px] leading-relaxed">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
