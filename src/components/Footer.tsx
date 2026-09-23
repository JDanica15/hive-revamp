import { AppLink } from "@/components/AppLink";
import { Facebook, Linkedin } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { ADMIN_URL, CONTACT, NAV_LINKS, SOCIAL } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 py-16 lg:py-20">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <div className="mb-6">
              <Logo variant="light" className="h-9 w-auto" />
            </div>
            <p className="text-background/60 max-w-sm leading-relaxed">
              Strategic HR and outsourcing solutions. We build dedicated teams that scale your business through human
              intelligence.
            </p>
          </div>
          <nav className="md:col-span-3" aria-label="Footer">
            <p className="text-xs tracking-[0.2em] uppercase text-background/40 mb-5">Navigate</p>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <AppLink href={link.href} className="text-background/80 hover:text-accent transition-colors">
                    {link.label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="md:col-span-4">
            <p className="text-xs tracking-[0.2em] uppercase text-background/40 mb-5">Contact</p>
            <address className="not-italic space-y-3 text-background/80">
              <p>
                {CONTACT.street}
                <br />
                {`${CONTACT.locality}, ${CONTACT.region} ${CONTACT.postalCode}, ${CONTACT.countryName}`}
              </p>
              <p>
                <a href={`mailto:${CONTACT.email}`} className="hover:text-accent transition-colors">
                  {CONTACT.email}
                </a>
              </p>
              <p>
                <a href={CONTACT.phoneHref} className="hover:text-accent transition-colors">
                  {CONTACT.phone}
                </a>
              </p>
            </address>
            <div className="flex gap-3 mt-6">
              <a
                href={SOCIAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Hive BPO on LinkedIn"
                className="w-10 h-10 rounded-full border border-background/20 flex items-center justify-center hover:bg-accent hover:border-accent transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Hive BPO on Facebook"
                className="w-10 h-10 rounded-full border border-background/20 flex items-center justify-center hover:bg-accent hover:border-accent transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-background/15 flex flex-col sm:flex-row justify-between gap-4 text-sm text-background/50">
          <p>© {new Date().getFullYear()} Hive BPO. All rights reserved.</p>
          <div className="flex gap-6">
            <AppLink href="/#contact" className="hover:text-background">
              Privacy
            </AppLink>
            <AppLink href="/#contact" className="hover:text-background">
              Terms
            </AppLink>
            <a href={ADMIN_URL} rel="nofollow" className="hover:text-background">
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
