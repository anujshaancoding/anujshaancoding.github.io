"use client";

import { useRef } from "react";

/** Glass card with a cursor-following radial highlight + gradient hairline. */
export function GlowCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`glass glow-card h-full p-6 ${className}`}
    >
      {children}
    </div>
  );
}
