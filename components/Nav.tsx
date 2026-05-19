"use client";

import { useEffect, useState } from "react";

const links = [
  { id: "about", label: "About" },
  { id: "visuals", label: "Visuals" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
];

export function Nav() {
  const [active, setActive] = useState("about");
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    links.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) io.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

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
          href="#top"
          className="font-display text-base font-semibold tracking-tight"
        >
          AnujShaan<span className="gradient-text">.</span>
        </a>
        <div className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={`relative rounded-md px-3 py-1.5 text-sm transition-colors ${
                active === l.id
                  ? "text-text"
                  : "text-muted hover:text-text"
              }`}
            >
              {active === l.id && (
                <span className="absolute inset-0 -z-10 rounded-md bg-white/[0.06]" />
              )}
              {l.label}
            </a>
          ))}
        </div>
        <a href="#contact" className="btn-ghost hidden text-sm sm:inline-flex">
          Get in touch
        </a>
      </div>
    </nav>
  );
}
