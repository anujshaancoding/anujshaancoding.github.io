"use client";

import { useEffect, useState } from "react";
import { useInView } from "./useInView";

/** Eases a number from 0 → value when scrolled into view. */
export function CountUp({
  value,
  suffix = "",
  duration = 1100,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.6);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setN(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}
