import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Article } from "@/components/blog/Article";
import { PostCard } from "@/components/blog/PostCard";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { formatDate, getAllPosts, getPost } from "@/lib/blog";
import { absoluteUrl, siteConfig } from "@/lib/site";

type Params = { slug: string };

// Pre-render every post at build time (fully static, SEO-friendly).
export function generateStaticParams(): Params[] {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const post = getPost(params.slug);
  if (!post) return { title: "Post not found" };

  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author }],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url,
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default function PostPage({ params }: { params: Params }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const more = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  // Structured data so search engines render a rich article result.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Person", name: siteConfig.name },
    keywords: post.tags.join(", "),
    url: absoluteUrl(`/blog/${post.slug}`),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    image: absoluteUrl("/opengraph-image.png"),
  };

  return (
    <main className="relative">
      <Nav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-6 pb-16 pt-32 sm:pt-36">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M19 12H5M11 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          All posts
        </Link>

        <header className="mt-8">
          {post.tags.length > 0 ? (
            <p className="kicker mb-4">{post.tags.join("  ·  ")}</p>
          ) : null}
          <h1 className="font-display text-3xl font-bold leading-[1.15] sm:text-[2.6rem]">
            {post.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span className="text-faint">·</span>
            <span>{post.readingTime} min read</span>
            <span className="text-faint">·</span>
            <span>{post.author}</span>
          </div>
        </header>

        <hr className="my-9 border-white/[0.08]" />

        <Article>{post.content}</Article>
      </article>

      {more.length > 0 ? (
        <section className="mx-auto max-w-content px-6 pb-20">
          <p className="kicker mb-6">More writing</p>
          <div className="grid gap-6 md:grid-cols-3">
            {more.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}
