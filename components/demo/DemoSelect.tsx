"use client";

import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

/** Dark-themed custom select. The OS-native <select> can't have its option
 *  list styled, so this renders its own popover to match the demo chrome. */
export function DemoSelect({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs text-text outline-none transition-colors ${
          open
            ? "border-accent/55 bg-white/[0.05]"
            : "border-white/[0.12] bg-white/[0.03] hover:border-white/25"
        }`}
      >
        <span className="truncate">{current?.label ?? "Select…"}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden
          className={`shrink-0 text-faint transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M2 3.5 5 6.5 8 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-full z-40 mt-1.5 max-h-64 min-w-full overflow-auto rounded-lg border border-white/[0.14] bg-[#0e1422] p-1 shadow-xl shadow-black/60"
        >
          {options.map((o) => {
            const on = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 whitespace-nowrap rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                    on
                      ? "bg-accent/15 text-text"
                      : "text-muted hover:bg-white/[0.06] hover:text-text"
                  }`}
                >
                  {o.label}
                  {on && (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 12 12"
                      aria-hidden
                      className="shrink-0 text-accent"
                    >
                      <path
                        d="M2.5 6.5 5 9l4.5-5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
