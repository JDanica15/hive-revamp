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
| `/` | Hero video, clients, team, services, testimonials, video stories, contact form |
| `/careers` | Careers hub: hero with live stats, benefits, searchable/filterable job board, slide-over application, video stories, employee story, hiring process, general application |
| `/careers/[id]` | One page per job with a sticky application card, related roles and `JobPosting` structured data |
| `/events` | Events grid with category filter |
| `/gallery` | Team photo albums (masonry grid, album filter, lightbox) |
| `/events/[id]` | Event detail with masonry gallery and lightbox |
| `/api/inquiries`, `/api/applications` | Forward form submissions to the Base44 `Inquiry` / `JobApplication` entities |

Old static-export URLs (`/index.html`, `/events/index.html`, …) permanently redirect to the clean URLs.

## Job applications and resumes

Applicants attach a resume (PDF, DOC or DOCX, up to 4 MB) by drag-and-drop or file picker. `/api/applications` checks the file type from its contents (not just the extension), uploads it to Base44 file storage (`Core.UploadFile`), then creates the `JobApplication` record with the file link in `resume_url`, so it shows up where applications are already reviewed in the Base44 admin. A LinkedIn/portfolio link, if given, is appended to the cover note. A hidden honeypot field silently drops bot submissions.

Settings live in `src/lib/careers.ts`: `RESUME_REQUIRED` (currently `true`), the size limit (kept under Vercel's 4.5 MB request cap), accepted types, the benefits and hiring-step copy. "Don't see your role?" submissions are saved with `job_listing_id: "general"` and the title "General Application".

## Content

Content lives in `src/data/*.json` (a snapshot of the Base44 entities). Images live in `public/media/`. Edit these files and redeploy to update the site. Intrinsic image sizes are listed in `src/lib/images.ts`; add an entry for any new gallery photo.

The Video Stories section (home and careers) is set up in `src/lib/stories.ts`: videos and posters in `public/media/stories/`, and the "Moments" photos are picked from the gallery. Videos are H.264 MP4s, 720p, with fast start, made from the raw files in `src/assets/`, which are git-ignored (`ffmpeg -i in.mov -vf scale=720:-2,fps=30,format=yuv420p -c:v libx264 -crf 26 -c:a aac -b:a 128k -movflags +faststart out.mp4`). Add a `role` to a story to show it under the name.

Gallery albums are listed in `src/lib/gallery.ts`, with photos in `public/media/gallery/<album>/01.jpg, 02.jpg…` (resized to 1600px on the long side). To add an album, drop the resized photos in a new folder, add an entry to `ALBUMS`, and add each photo's size to `src/lib/images.ts`.

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
