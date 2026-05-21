# Portfolio — Power BI Custom Visuals / Data Viz Engineer

Single-page portfolio. **You only edit one file:** `data/profile.ts`.

## Run it

```bash
cd "career-plan/portfolio"
npm install
npm run dev      # http://localhost:3000
```

## Fill in your details

1. Open `data/profile.ts` and replace every `TODO:` value.
2. Put your resume PDF at `public/resume.pdf`.
3. Add screenshots of your Power BI visuals to `public/` and set the
   `image` paths in `profile.visuals`.

## Blog

Posts live as Markdown files in `content/blog/` — one file per post. The
`/blog` index, each `/blog/<slug>` page, the homepage "Writing" section,
the sitemap and SEO tags all update automatically.

To add a post, create `content/blog/<slug>.md` (the file name becomes the
URL) with this frontmatter, then write the body in Markdown:

```markdown
---
title: "Your headline"
date: "2026-05-21"
excerpt: "1-2 sentence summary — also used as the SEO meta description."
tags: ["power-bi", "dataviz"]
author: "Anuj Kumar"
---

## A heading

Normal **Markdown** — lists, links, `code`, tables, quotes.
```

Files whose name starts with `_` are treated as drafts and skipped.

### SEO

Every post is statically pre-rendered with a canonical URL, OpenGraph +
Twitter card tags, `BlogPosting` JSON-LD structured data, and an
auto-generated 1200×630 share image. `app/sitemap.ts` and `app/robots.ts`
expose `/sitemap.xml` and `/robots.txt`.

For correct absolute URLs on a custom domain, set `NEXT_PUBLIC_SITE_URL`
in the Vercel project env vars (on a `*.vercel.app` URL it's detected
automatically).

## Deploy free

- Push to GitHub → import on **Vercel** (vercel.com) → live URL in ~2 min.
- Put that URL on your resume, LinkedIn headline, and freelance profiles.

## What to prioritize in content

The **Power BI Custom Visuals** section is your differentiator — make it
concrete: the problem native visuals couldn't solve, how you built it,
the measurable impact. One screenshot beats three paragraphs.
