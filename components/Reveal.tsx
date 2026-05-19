"use client";

import { useInView } from "./useInView";

/** Fades + lifts children in when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(22px)",
        transition: `opacity 700ms ease ${delay}ms, transform 700ms cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
