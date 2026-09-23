"use client";

import { motion } from "framer-motion";
import { ContactForm } from "@/components/home/ContactForm";
import { CONTACT } from "@/lib/site";

export function Contact() {
  return (
    <section
      id="contact"
      className="py-24 lg:py-32 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto"
      aria-labelledby="contact-heading"
    >
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">Let&apos;s Talk</p>
            <h2 id="contact-heading" className="font-heading text-4xl lg:text-5xl font-medium text-balance leading-tight mb-6">
              Reach out, and let&apos;s elevate your business together
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-10">
              We take pride in applying our expertise to your challenges. Tell us how we can help — every inquiry is
              reviewed by a senior member of our team.
            </p>
            <div className="space-y-4 pt-8 border-t border-border">
              <div>
                <p className="text-xs tracking-wider uppercase text-muted-foreground mb-1">Sydney, Australia</p>
                <p className="text-foreground">Suite 2, Level 14, 189 Kent St, Sydney, NSW 2000</p>
              </div>
              <div className="flex gap-8">
                <div>
                  <p className="text-xs tracking-wider uppercase text-muted-foreground mb-1">Email</p>
                  <a href={`mailto:${CONTACT.email}`} className="hover:text-accent transition-colors">
                    {CONTACT.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs tracking-wider uppercase text-muted-foreground mb-1">Phone</p>
                  <a href={CONTACT.phoneHref} className="hover:text-accent transition-colors">
                    {CONTACT.phone}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
