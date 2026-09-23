# Hive BPO — Next.js

A Next.js (App Router) rebuild of the Hive BPO site exported from Base44. Every page uses the same markup, the same Tailwind classes, the same icons and the same animations as the original, and all pages are prerendered to static HTML for SEO.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL` to the production domain. It is used for canonical URLs, Open Graph tags, JSON-LD and the sitemap.

Deploys as-is to Vercel or any Node host. The contact and job-application forms use server routes, so a static-only host (`output: "export"`) is not supported.

## Routes

| Route | Source |
| --- | --- |
| `/` | Hero video, clients, team, services, testimonials, contact form |
| `/careers` | Job board with department filter and slide-over application panel |
| `/careers/[id]` | One page per job, with `JobPosting` structured data for Google Jobs (new) |
| `/events` | Events grid with category filter |
| `/events/[id]` | Event detail with masonry gallery and lightbox |
| `/api/inquiries`, `/api/applications` | Forward form submissions to the Base44 `Inquiry` / `JobApplication` entities |

Old static-export URLs (`/index.html`, `/events/index.html`, …) permanently redirect to the clean URLs.

## Content

Content lives in `src/data/*.json` (a snapshot of the Base44 entities). Images live in `public/media/`. Edit these files and redeploy to update the site. Intrinsic image sizes are listed in `src/lib/images.ts`; add an entry for any new gallery photo.

## SEO

- Static HTML for every page, with a unique title, description, canonical URL, Open Graph and Twitter tags on each
- JSON-LD: `ProfessionalService` (organisation, address, contact, service catalogue), `WebSite`, `BreadcrumbList`, `JobPosting`, `Event`, `ItemList`
- `sitemap.xml` (including event images), `robots.txt`, web manifest, favicons, generated Open Graph image
- Semantic landmarks (`main`, `nav`, `article`, `figure`), a single `h1` per page, labelled form fields, skip link
- `next/image` (AVIF/WebP, responsive `srcset`, lazy loading) for all photos
- Optional Search Console verification through `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_SITE_VERIFICATION`

## Known issues carried over from the original

- The header logo is loaded from `hivebpo.com`, which blocks downloads. Save it to `public/` and update `LOGO_URL` in `src/lib/site.ts` to host it yourself.
- Several Unsplash photos no longer exist, as on the live site: three "One global team" hexagons (shown broken), two client testimonial photos, and one gallery photo each in "Team Building Day" and "Mid-Year Team Retreat". The last two groups show the grey placeholder. Replace the URLs in `src/components/home/HiveTeam.tsx`, `src/data/testimonials.json` and `src/data/events.json`.
- The design references the Fraunces and Inter fonts, but the original never loads them, so the site renders in Georgia and the system sans-serif. To use the intended fonts, load them with `next/font` and set `--font-heading` / `--font-body`.
- The LinkedIn and Facebook links point to the generic homepages.
