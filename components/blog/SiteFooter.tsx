import Link from "next/link";
import { profile } from "@/data/profile";

/** Lightweight footer for the blog routes (the homepage has its own). */
export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-content flex-col items-center justify-between gap-3 border-t border-white/[0.07] px-6 py-8 text-xs text-faint sm:flex-row">
      <span>
        © {new Date().getFullYear()} {profile.name}
      </span>
      <div className="flex gap-5">
        <Link href="/" className="transition-colors hover:text-text">
          Home
        </Link>
        <Link href="/blog" className="transition-colors hover:text-text">
          Blog
        </Link>
        <a
          href={profile.links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-text"
        >
          LinkedIn
        </a>
      </div>
    </footer>
  );
}
