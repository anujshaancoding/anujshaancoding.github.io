"use client";

import { useState } from "react";

/**
 * Headshot with a gradient ring. Falls back to initials if `src` is empty
 * or the image fails to load — so the layout never breaks before a photo
 * is dropped into /public.
 */
export function Avatar({
  src,
  name,
  size,
  className = "",
}: {
  src: string;
  name: string;
  size: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const show = src && !failed;

  return (
    <div
      className={`relative shrink-0 rounded-full p-[2px] ${className}`}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(150deg,#4c8dff,#9a6bff 55%,#3de0c2)",
      }}
    >
      <div className="h-full w-full overflow-hidden rounded-full bg-panel">
        {show ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-display font-semibold text-muted"
            style={{ fontSize: size * 0.34 }}
          >
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}
