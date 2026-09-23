"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AppLink } from "@/components/AppLink";
import { ArrowUpRight, Plus, X } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { CONTACT, NAV_LINKS } from "@/lib/site";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass =
    "text-sm font-medium tracking-wide transition-colors " +
    (scrolled ? "text-foreground/70 hover:text-foreground" : "text-background/80 hover:text-background");

  return (
    <>
      <header
        className={
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 " +
          (scrolled ? "bg-background/95 backdrop-blur-md border-b border-border" : "bg-transparent")
        }
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 flex items-center justify-between h-20">
          <AppLink href="/" className="flex items-center gap-2.5" aria-label="Hive BPO home">
            <Logo className="h-8 w-auto" variant={scrolled ? "dark" : "light"} />
          </AppLink>
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <AppLink key={link.label} href={link.href} className={linkClass}>
                {link.label}
              </AppLink>
            ))}
            <AppLink
              href="/#contact"
              className="group inline-flex items-center gap-1.5 px-5 py-2.5 bg-accent text-accent-foreground rounded-full text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Get a Quote
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </AppLink>
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-foreground/90 text-background backdrop-blur-md rounded-full"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className="text-xs font-medium tracking-wider uppercase">Menu</span>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-xl lg:hidden"
          >
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute top-6 right-6 p-2.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="h-full flex flex-col justify-center px-6 sm:px-16 max-w-7xl mx-auto">
              <ul className="space-y-5">
                {NAV_LINKS.map((link, i) => (
                  <li key={link.label}>
                    <AppLink
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="font-heading text-3xl sm:text-4xl font-medium hover:text-accent transition-colors duration-200"
                    >
                      <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                      >
                        {link.label}
                      </motion.span>
                    </AppLink>
                  </li>
                ))}
              </ul>
              <div className="mt-16 pt-8 border-t border-border flex flex-wrap gap-x-12 gap-y-2 text-sm text-muted-foreground">
                <span>Suite 2, Level 14, 189 Kent St, Sydney, NSW 2000</span>
                <a href={`mailto:${CONTACT.email}`} className="hover:text-foreground">
                  {CONTACT.email}
                </a>
                <a href={CONTACT.phoneHref} className="hover:text-foreground">
                  {CONTACT.phone}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
