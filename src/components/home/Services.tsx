"use client";

import { motion } from "framer-motion";
import { Briefcase, Calculator, ClipboardList, Headphones, ShieldCheck, Users } from "@/components/icons";
import { SERVICES } from "@/lib/site";

const ICONS = {
  users: Users,
  calculator: Calculator,
  headphones: Headphones,
  clipboard: ClipboardList,
  briefcase: Briefcase,
  shield: ShieldCheck,
};

export function Services() {
  return (
    <section
      id="services"
      className="py-24 lg:py-32 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto"
      aria-labelledby="services-heading"
    >
      <div className="grid lg:grid-cols-12 gap-12 mb-16">
        <div className="lg:col-span-5">
          <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">What We Do</p>
          <h2 id="services-heading" className="font-heading text-4xl lg:text-5xl font-medium text-balance leading-tight">
            A modular ecosystem of expertise
          </h2>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 flex items-end">
          <p className="text-lg text-muted-foreground leading-relaxed">
            We don&apos;t sell hours — we deliver outcomes. Each service is a distinct capability that can be deployed
            independently or orchestrated together as a complete operational layer for your business.
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-sm overflow-hidden">
        {SERVICES.map((service, i) => {
          const Icon = ICONS[service.icon];
          return (
            <motion.article
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group bg-background p-8 lg:p-10 hover:bg-card transition-colors duration-300 relative"
            >
              <div className="absolute left-0 top-0 bottom-0 w-px bg-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />
              <Icon className="w-7 h-7 text-accent mb-6" strokeWidth={1.5} />
              <h3 className="font-heading text-2xl font-medium mb-3">{service.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">{service.description}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
