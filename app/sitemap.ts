import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: new Date(`${p.date}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: posts[0]
        ? new Date(`${posts[0].date}T00:00:00Z`)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...postEntries,
  ];
}
