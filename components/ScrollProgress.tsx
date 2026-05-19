"use client";

import { useEffect, useState } from "react";

/** Thin gradient progress bar pinned to the very top of the viewport. */
export function ScrollProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent">
      <div
        className="h-full origin-left"
        style={{
          width: `${p}%`,
          background:
            "linear-gradient(90deg,#4c8dff,#9a6bff 50%,#3de0c2)",
        }}
      />
    </div>
  );
}
