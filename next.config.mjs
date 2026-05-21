/** @type {import('next').NextConfig} */
const nextConfig = {
  // The build output dir is overridable via NEXT_DIST_DIR. A verification
  // `next build` can target its own folder (e.g. `.next-verify`) so it never
  // clobbers the `.next` that a running `next dev` server depends on —
  // which is what was crashing the dev server with "Cannot find module".
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
