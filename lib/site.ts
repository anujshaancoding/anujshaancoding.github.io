// Central site config — used for SEO (canonical URLs, OpenGraph, sitemap).
//
// On Vercel the production URL is detected automatically. To pin a custom
// domain, set NEXT_PUBLIC_SITE_URL in the Vercel project env vars, e.g.
//   NEXT_PUBLIC_SITE_URL=https://anujkumar.dev

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const siteConfig = {
  name: "Anuj Kumar",
  title: "Anuj Kumar — Data Visualization Engineer",
  description:
    "Data Visualization Engineer building production-grade Power BI custom visuals with React, D3.js and TypeScript.",
};

/** Build an absolute URL from a site-relative path (for canonical / OG tags). */
export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
