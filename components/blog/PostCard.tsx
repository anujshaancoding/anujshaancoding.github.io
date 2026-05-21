import Link from "next/link";
import { GlowCard } from "@/components/GlowCard";
import { formatDate, type PostMeta } from "@/lib/blog";

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Compact teaser card for a blog post — used on /blog and the homepage. */
export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block h-full">
      <GlowCard className="flex flex-col">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-accent2">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span className="text-faint">·</span>
          <span>{post.readingTime} min read</span>
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold leading-snug">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
            {post.excerpt}
          </p>
        ) : (
          <div className="flex-1" />
        )}
        {post.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm text-accent">
          Read article <Arrow />
        </span>
      </GlowCard>
    </Link>
  );
}
