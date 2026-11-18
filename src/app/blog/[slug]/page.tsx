import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/blog/Markdown";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowLeft } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { getPublishedPost, getPublishedPosts, readingMinutes } from "@/lib/blog";
import { formatLongDate } from "@/lib/format";
import { blogPostJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { OG_DEFAULTS } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

// Posts come from Supabase: re-check every 5 minutes, and build pages for new posts on first visit.
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getPublishedPosts(100)).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await getPublishedPost((await params).slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;
  const images = post.cover_image_url ? [{ url: post.cover_image_url, alt: post.cover_alt || post.title }] : undefined;
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    keywords: post.focus_keyword ? [post.focus_keyword, ...post.tags] : undefined,
    alternates: { canonical: url },
    openGraph: {
      ...OG_DEFAULTS,
      type: "article",
      url,
      title: `${post.meta_title || post.title} | Hive BPO`,
      description: post.meta_description || post.excerpt,
      images,
      publishedTime: post.published_date ?? undefined,
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: `${post.meta_title || post.title} | Hive BPO`, description: post.meta_description || post.excerpt, images },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const post = await getPublishedPost((await params).slug);
  if (!post) notFound();
  const more = (await getPublishedPosts(4)).filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          blogPostJsonLd(post),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <Header />
      <main id="main">
        <article>
          <div className="pt-28 px-6 sm:px-12 lg:px-24 max-w-3xl mx-auto">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              All articles
            </Link>
            <p className="mt-10 text-xs tracking-[0.2em] uppercase text-muted-foreground">
              {post.published_date && <time dateTime={post.published_date}>{formatLongDate(post.published_date)}</time>} ·{" "}
              {readingMinutes(post.body)} min read
            </p>
            <h1 className="mt-4 font-heading text-4xl lg:text-5xl font-medium text-balance leading-[1.08]">{post.title}</h1>
            {post.excerpt && <p className="mt-6 text-xl text-muted-foreground leading-relaxed">{post.excerpt}</p>}
          </div>

          {post.cover_image_url && (
            <div className="px-6 sm:px-12 lg:px-24 max-w-5xl mx-auto mt-10">
              <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-muted">
                <Image
                  src={post.cover_image_url}
                  alt={post.cover_alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 960px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div className="px-6 sm:px-12 lg:px-24 max-w-3xl mx-auto mt-10 pb-16">
            <Markdown source={post.body} />
            {post.tags.length > 0 && (
              <ul className="mt-12 flex flex-wrap gap-2" aria-label="Tags">
                {post.tags.map((tag) => (
                  <li key={tag} className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground capitalize">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>

        {more.length > 0 && (
          <section className="border-t border-border px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto py-16" aria-label="More articles">
            <h2 className="font-heading text-2xl font-medium mb-8">More from the blog</h2>
            <ul className="grid sm:grid-cols-3 gap-8">
              {more.map((p) => (
                <li key={p.id}>
                  <Link href={`/blog/${p.slug}`} className="group block">
                    <h3 className="font-heading text-lg font-medium leading-snug group-hover:text-accent transition-colors">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
