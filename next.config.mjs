/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export — the whole site is prerendered to `out/` and served
  // by GitHub Pages. No Node server runs in production.
  output: "export",

  // GitHub Pages can't run the Next.js image optimizer, so images are served
  // as-is. (The site currently uses plain <img>, but this future-proofs it.)
  images: { unoptimized: true },

  // The build output dir is overridable via NEXT_DIST_DIR. A verification
  // `next build` can target its own folder (e.g. `.next-verify`) so it never
  // clobbers the `.next` that a running `next dev` server depends on —
  // which is what was crashing the dev server with "Cannot find module".
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
