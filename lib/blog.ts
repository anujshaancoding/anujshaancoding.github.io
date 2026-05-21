// Blog content layer. Posts are plain Markdown files in `content/blog/`,
// one file per post, with YAML frontmatter. Everything below reads from
// disk at build time — no database, no CMS.
//
// To add a post: drop a `<slug>.md` file in `content/blog/` with frontmatter:
//
//   ---
//   title: "Your headline"
//   date: "2026-05-21"
//   excerpt: "1-2 sentence summary — also used as the SEO meta description."
//   tags: ["power-bi", "dataviz"]
//   author: "Anuj Kumar"
//   ---
//
// Files whose name starts with "_" or "." are ignored (drafts / templates).

import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type PostMeta = {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  excerpt: string;
  tags: string[];
  author: string;
  cover?: string;
  readingTime: number; // minutes
};

export type Post = PostMeta & { content: string };

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/** YAML may parse an unquoted date into a Date — normalise to yyyy-mm-dd. */
function toISODate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function parsePost(filename: string): Post {
  const slug = filename.replace(/\.md$/i, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    date: toISODate(data.date),
    excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
    tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t)) : [],
    author: typeof data.author === "string" ? data.author : "Anuj Kumar",
    cover:
      typeof data.cover === "string" && data.cover ? data.cover : undefined,
    readingTime: estimateReadingTime(content),
    content,
  };
}

/** Every published post, newest first. */
export function getAllPosts(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter(
      (f) => /\.md$/i.test(f) && !f.startsWith("_") && !f.startsWith("."),
    )
    .map(parsePost)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getPost(slug: string): Post | null {
  const file = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  try {
    return parsePost(`${slug}.md`);
  } catch {
    return null;
  }
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
