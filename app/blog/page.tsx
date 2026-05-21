import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { PostCard } from "@/components/blog/PostCard";
import { SiteFooter } from "@/components/blog/SiteFooter";
import { getAllPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site";

const title = "Blog — Power BI Custom Visuals & Data Visualization";
const description =
  "Notes, news and practical tips on building Power BI custom visuals, D3.js and data visualization engineering — by Anuj Kumar.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Power BI custom visuals",
    "Power BI development",
    "D3.js",
    "data visualization",
    "dataviz blog",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title,
    description,
    type: "website",
    url: absoluteUrl("/blog"),
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="mx-auto max-w-content px-6 pb-20 pt-32 sm:pt-36">
        <p className="kicker mb-3">
          <span className="text-accent">~</span> — Writing
        </p>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          The <span className="gradient-text">Blog</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          {description}
        </p>

        {posts.length === 0 ? (
          <div className="glass mt-12 p-10 text-center text-sm text-muted">
            No posts yet — the first article is on its way.
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
