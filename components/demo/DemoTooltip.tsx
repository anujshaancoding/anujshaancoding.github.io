"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** One tooltip design, shared by all three demos. */

export type TooltipRow = { label: string; value: string; emphasis?: boolean };

export type TooltipModel = {
  /** Anchor position, in coordinates local to the chart wrapper. */
  x: number;
  y: number;
  /** Chart wrapper size — used to flip the card away from the nearest edge. */
  w: number;
  h: number;
  title: string;
  accent: string;
  kicker: string;
  rows: TooltipRow[];
  /**
   * Explicit open direction from the anchor. When omitted, the card opens
   * toward whichever side of the wrapper has the most room.
   */
  side?: { x: "left" | "right"; y: "up" | "down" };
};

/** useLayoutEffect on the client, useEffect on the server (no SSR warning). */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Cursor anchor (wrapper-local x/y + wrapper size) for a pointer event. */
export function tooltipAnchor(
  wrap: HTMLElement | null,
  e: { clientX: number; clientY: number },
): { x: number; y: number; w: number; h: number } {
  const r = wrap?.getBoundingClientRect();
  if (!r) return { x: 0, y: 0, w: 1, h: 1 };
  return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
}

export function DemoTooltip({ model }: { model: TooltipModel | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState({ x: 0, y: 0, key: "" });

  const key = model
    ? `${model.title}|${Math.round(model.x)}|${Math.round(model.y)}`
    : "";

  // After paint, nudge the card back inside the wrapper if it overflows —
  // so an edge-anchored card is never clipped by the chart container.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !model) return;
    const parent = el.offsetParent as HTMLElement | null;
    if (!parent) return;
    const c = el.getBoundingClientRect();
    const p = parent.getBoundingClientRect();
    const pad = 8;
    const applied = shift.key === key ? shift : { x: 0, y: 0 };
    // Rectangle as it would sit with no shift applied.
    const left = c.left - applied.x;
    const right = c.right - applied.x;
    const top = c.top - applied.y;
    const bottom = c.bottom - applied.y;
    let dx = 0;
    let dy = 0;
    if (left < p.left + pad) dx = p.left + pad - left;
    else if (right > p.right - pad) dx = p.right - pad - right;
    if (top < p.top + pad) dy = p.top + pad - top;
    else if (bottom > p.bottom - pad) dy = p.bottom - pad - bottom;
    if (dx !== applied.x || dy !== applied.y || shift.key !== key) {
      setShift({ x: dx, y: dy, key });
    }
  }, [model, shift, key]);

  if (!model) return null;

  const sideX = model.side
    ? model.side.x
    : model.x < model.w / 2
      ? "right"
      : "left";
  const sideY = model.side
    ? model.side.y
    : model.y < model.h / 2
      ? "down"
      : "up";
  const offX = sideX === "right" ? "16px" : "calc(-100% - 16px)";
  const offY = sideY === "down" ? "14px" : "calc(-100% - 14px)";
  const sx = shift.key === key ? shift.x : 0;
  const sy = shift.key === key ? shift.y : 0;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute z-20 w-[214px]"
      style={{
        left: model.x,
        top: model.y,
        transform: `translate(${offX}, ${offY}) translate(${sx}px, ${sy}px)`,
      }}
    >
      <div className="demo-tooltip">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{
              background: model.accent,
              boxShadow: `0 0 9px ${model.accent}`,
            }}
          />
          <span className="truncate font-display text-sm font-semibold text-text">
            {model.title}
          </span>
        </div>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.17em] text-faint">
          {model.kicker}
        </p>
        <dl className="mt-2.5 space-y-1.5 border-t border-white/10 pt-2.5">
          {model.rows.map((r) => (
            <div
              key={r.label}
              className="flex items-baseline justify-between gap-3"
            >
              <dt className="text-[11px] text-muted">{r.label}</dt>
              <dd
                className={`text-right font-mono text-[11px] tabular-nums ${
                  r.emphasis ? "font-semibold text-accent3" : "text-text"
                }`}
              >
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
