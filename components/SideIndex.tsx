"use client";

import { useEffect, useState } from "react";

const items = [
  { id: "top", label: "Intro" },
  { id: "about", label: "About" },
  { id: "visuals", label: "Visuals" },
  { id: "demos", label: "Demos" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

/** Fixed vertical section index (desktop only). */
export function SideIndex() {
  const [active, setActive] = useState("top");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div className="fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 xl:flex">
      {items.map((i) => {
        const on = active === i.id;
        return (
          <a
            key={i.id}
            href={`#${i.id}`}
            className="group flex items-center gap-3"
            aria-label={i.label}
          >
            <span
              className={`h-px transition-all duration-300 ${
                on
                  ? "w-8 bg-accent"
                  : "w-4 bg-white/20 group-hover:w-6 group-hover:bg-white/40"
              }`}
            />
            <span
              className={`font-mono text-[11px] transition-colors ${
                on
                  ? "text-text"
                  : "text-faint group-hover:text-muted"
              }`}
            >
              {i.label}
            </span>
          </a>
        );
      })}
    </div>
  );
}
