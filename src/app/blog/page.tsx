import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { getPublishedPosts, readingMinutes } from "@/lib/blog";
import { formatShortDate } from "@/lib/format";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { OG_DEFAULTS } from "@/lib/site";

const TITLE = "Blog — Insights on Outsourcing, HR, Finance & Support";
const DESCRIPTION =
  "Practical articles from Hive BPO on outsourcing HR, bookkeeping and customer service, and on building strong distributed teams.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: { ...OG_DEFAULTS, url: "/blog", title: `${TITLE} | Hive BPO`, description: DESCRIPTION },
  twitter: { title: `${TITLE} | Hive BPO`, description: DESCRIPTION },
};

// New posts appear within 5 minutes (publishing from the admin panel also refreshes this page at once).
export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ]}
      />
      <Header />
      <main id="main">
        <section className="pt-32 pb-12 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto">
          <p className="text-accent text-sm font-medium tracking-[0.25em] uppercase mb-5">The Hive Blog</p>
          <h1 className="font-heading text-5xl lg:text-6xl font-medium text-balance leading-[1]">Ideas worth sharing</h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            Practical thinking on outsourcing, HR, finance and customer support — and on building teams that work well across
            borders.
          </p>
        </section>

        <section className="px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto pb-24" aria-label="Posts">
          {posts.length === 0 ? (
            <p className="text-muted-foreground py-20 text-center">Our first articles are on the way. Check back soon.</p>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {posts.map((post, i) => (
                <li key={post.id}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-muted">
                      {post.cover_image_url && (
                        <Image
                          src={post.cover_image_url}
                          alt={post.cover_alt}
                          fill
                          sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw"
                          priority={i < 3}
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <p className="mt-5 text-xs tracking-[0.15em] uppercase text-muted-foreground">
                      {post.published_date && <time dateTime={post.published_date}>{formatShortDate(post.published_date)}</time>} ·{" "}
                      {readingMinutes(post.body)} min read
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-medium leading-snug text-balance group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>
                    <p className="mt-3 text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
