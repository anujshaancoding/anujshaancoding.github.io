"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Homepage sections (scroll anchors). The Blog link is a separate route.
const sections = [
  { id: "about", label: "About" },
  { id: "visuals", label: "Visuals" },
  { id: "demos", label: "Demos" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
];

const linkClass = (active: boolean) =>
  `relative rounded-md px-3 py-1.5 text-sm transition-colors ${
    active ? "text-text" : "text-muted hover:text-text"
  }`;

export function Nav() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const onBlog = pathname.startsWith("/blog");
  const [active, setActive] = useState("about");
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Section highlighting only applies on the homepage.
    let io: IntersectionObserver | undefined;
    if (onHome) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setActive(e.target.id);
          });
        },
        { rootMargin: "-45% 0px -50% 0px" },
      );
      sections.forEach((s) => {
        const el = document.getElementById(s.id);
        if (el) io!.observe(el);
      });
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, [onHome]);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid
          ? "border-b border-white/[0.07] bg-bg/70 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4">
        <a
          href="/#top"
          className="font-display text-base font-semibold tracking-tight"
        >
          AnujShaan<span className="gradient-text">.</span>
        </a>
        <div className="hidden items-center gap-1 sm:flex">
          {sections.map((s) => {
            const isActive = onHome && active === s.id;
            return (
              <a key={s.id} href={`/#${s.id}`} className={linkClass(isActive)}>
                {isActive && (
                  <span className="absolute inset-0 -z-10 rounded-md bg-white/[0.06]" />
                )}
                {s.label}
              </a>
            );
          })}
          <Link href="/blog" className={linkClass(onBlog)}>
            {onBlog && (
              <span className="absolute inset-0 -z-10 rounded-md bg-white/[0.06]" />
            )}
            Blog
          </Link>
        </div>
        <a href="/#contact" className="btn-ghost hidden text-sm sm:inline-flex">
          Get in touch
        </a>
      </div>
    </nav>
  );
}
