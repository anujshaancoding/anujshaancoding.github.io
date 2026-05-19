"use client";

import { useState } from "react";
import type { VisualKind } from "@/data/profile";
import { useInView } from "@/components/useInView";
import { arcPath, linePath, linearScale, polar, seeded } from "@/lib/scales";

const W = 420;
const H = 200;

const C = {
  blue: "#4c8dff",
  violet: "#9a6bff",
  teal: "#3de0c2",
  ink: "#E8EDF7",
  grid: "#ffffff14",
  dim: "#8a93a6",
};

const KIND_LABEL: Record<VisualKind, string> = {
  matrix: "matrix · in-cell charts",
  network: "force-directed graph",
  sankey: "sankey · flow",
  gauge: "radial gauge",
};

/** Framed, LIVE mini-chart for a Power BI visual card. */
export function VisualThumb({ kind }: { kind: VisualKind }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <div
      ref={ref}
      className="relative mb-5 overflow-hidden rounded-xl border border-white/[0.07] bg-black/30"
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          {KIND_LABEL[kind]}
        </span>
        <span className="live-pill">live</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`${kind} chart preview`}
      >
        {kind === "matrix" && <Matrix on={inView} />}
        {kind === "network" && <Network on={inView} />}
        {kind === "sankey" && <Sankey on={inView} />}
        {kind === "gauge" && <Gauge on={inView} />}
      </svg>
    </div>
  );
}

/* ---------- Power Table: Excel-style matrix with in-cell charts ---------- */
function Matrix({ on }: { on: boolean }) {
  const rows = ["North", "South", "East", "West", "Central"];
  const rnd = seeded(7);
  const data = rows.map(() => ({
    bar: 0.35 + rnd() * 0.6,
    spark: Array.from({ length: 9 }, () => 0.2 + rnd() * 0.8),
    bullet: 0.4 + rnd() * 0.55,
  }));
  const [hover, setHover] = useState<number | null>(null);
  const rowH = 28;
  const top = 34;

  return (
    <g fontSize={10} fontFamily="var(--font-mono), monospace" fill={C.dim}>
      <text x={18} y={22} fill={C.ink} fontWeight={600}>Region</text>
      <text x={132} y={22} fill={C.ink} fontWeight={600}>Trend</text>
      <text x={258} y={22} fill={C.ink} fontWeight={600}>Share</text>
      <text x={352} y={22} fill={C.ink} fontWeight={600}>Target</text>
      <line x1={14} y1={28} x2={406} y2={28} stroke={C.grid} />
      {data.map((d, i) => {
        const y = top + i * rowH;
        const active = hover === i;
        return (
          <g
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={8}
              y={y}
              width={404}
              height={rowH}
              fill={active ? "#4c8dff22" : i % 2 ? "#ffffff07" : "transparent"}
            />
            <text x={18} y={y + 18} fill={C.ink}>{rows[i]}</text>
            <path
              d={linePath(
                d.spark.map((v, j) => [122 + j * 13, y + 20 - v * 15]),
              )}
              fill="none"
              stroke={C.blue}
              strokeWidth={1.6}
              style={{
                strokeDasharray: 240,
                strokeDashoffset: on ? 0 : 240,
                transition: `stroke-dashoffset 1000ms ease ${i * 110}ms`,
              }}
            />
            <rect x={240} y={y + 9} width={92} height={10} rx={2} fill="#ffffff10" />
            <rect
              x={240}
              y={y + 9}
              width={on ? d.bar * 92 : 0}
              height={10}
              rx={2}
              fill={C.violet}
              style={{ transition: `width 900ms ease ${i * 110}ms` }}
            />
            <rect x={346} y={y + 11} width={58} height={6} rx={2} fill="#ffffff10" />
            <rect
              x={346}
              y={y + 11}
              width={on ? d.bullet * 58 : 0}
              height={6}
              rx={2}
              fill={C.teal}
              style={{ transition: `width 900ms ease ${i * 110}ms` }}
            />
            <line
              x1={346 + 0.75 * 58}
              y1={y + 8}
              x2={346 + 0.75 * 58}
              y2={y + 20}
              stroke={C.ink}
              strokeWidth={1.5}
            />
          </g>
        );
      })}
    </g>
  );
}

/* ---------- Network graph: nodes & links, hover highlights neighbours ---------- */
function Network({ on }: { on: boolean }) {
  const rnd = seeded(42);
  const nodes = Array.from({ length: 13 }, (_, i) => ({
    id: i,
    x: 46 + rnd() * (W - 92),
    y: 30 + rnd() * (H - 60),
    r: 5 + rnd() * 7,
  }));
  const links = Array.from({ length: 16 }, (_, i) => ({
    s: i % nodes.length,
    t: Math.floor(rnd() * nodes.length),
  })).filter((l) => l.s !== l.t);
  const [hover, setHover] = useState<number | null>(null);
  const near = (id: number) =>
    hover === null ||
    hover === id ||
    links.some(
      (l) => (l.s === hover && l.t === id) || (l.t === hover && l.s === id),
    );

  return (
    <g>
      {links.map((l, i) => {
        const a = nodes[l.s];
        const b = nodes[l.t];
        const lit = hover === l.s || hover === l.t;
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={on ? b.x : a.x}
            y2={on ? b.y : a.y}
            stroke={lit ? C.blue : "#ffffff1f"}
            strokeWidth={lit ? 1.8 : 1}
            style={{ transition: `all 800ms ease ${i * 35}ms` }}
          />
        );
      })}
      {nodes.map((n) => {
        const active = near(n.id);
        return (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={on ? n.r : 0}
            fill={hover === n.id ? C.violet : C.blue}
            opacity={active ? 1 : 0.22}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
            style={{
              cursor: "pointer",
              transition: "r 700ms cubic-bezier(.22,1,.36,1), opacity 250ms",
            }}
          />
        );
      })}
    </g>
  );
}

/* ---------- Sankey: flow ribbons across three stages ---------- */
function Sankey({ on }: { on: boolean }) {
  const cols = [70, 215, 360];
  const ribbon = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    h: number,
  ) =>
    `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2} ` +
    `L${x2},${y2 + h} C${(x1 + x2) / 2},${y2 + h} ${(x1 + x2) / 2},${
      y1 + h
    } ${x1},${y1 + h} Z`;

  return (
    <g
      style={{ opacity: on ? 1 : 0, transition: "opacity 800ms ease" }}
    >
      <path d={ribbon(cols[0] + 11, 44, cols[1], 38, 42)} fill={C.blue} opacity={0.34} />
      <path d={ribbon(cols[0] + 11, 116, cols[1], 112, 46)} fill={C.violet} opacity={0.34} />
      <path d={ribbon(cols[1] + 11, 40, cols[2], 34, 30)} fill={C.blue} opacity={0.34} />
      <path d={ribbon(cols[1] + 11, 112, cols[2], 92, 28)} fill={C.violet} opacity={0.34} />
      <path d={ribbon(cols[1] + 11, 80, cols[2], 138, 30)} fill={C.teal} opacity={0.3} />
      {[
        { y: 40, h: 56 },
        { y: 112, h: 62 },
      ].map((n, i) => (
        <rect key={`l${i}`} x={cols[0]} y={n.y} width={11} height={n.h} rx={2} fill={C.ink} />
      ))}
      {[
        { y: 36, h: 60 },
        { y: 110, h: 66 },
      ].map((n, i) => (
        <rect key={`m${i}`} x={cols[1]} y={n.y} width={11} height={n.h} rx={2} fill={C.ink} />
      ))}
      {[
        { y: 32, h: 44 },
        { y: 88, h: 40 },
        { y: 136, h: 38 },
      ].map((n, i) => (
        <rect key={`r${i}`} x={cols[2]} y={n.y} width={11} height={n.h} rx={2} fill={C.ink} />
      ))}
    </g>
  );
}

/* ---------- Gauge: animated semicircle with needle ---------- */
function Gauge({ on }: { on: boolean }) {
  const cx = W / 2;
  const cy = 158;
  const r = 100;
  const target = 72;
  const angle = linearScale([0, 100], [-90, 90]);
  const val = on ? target : 0;
  // Needle shares the arc's value angle exactly so its tip meets the arc end.
  const [nx, ny] = polar(cx, cy, r - 20, angle(val));

  return (
    <g>
      <path
        d={arcPath(cx, cy, r, -90, 90)}
        fill="none"
        stroke="#ffffff12"
        strokeWidth={16}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="gaugeg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.blue} />
          <stop offset="60%" stopColor={C.violet} />
          <stop offset="100%" stopColor={C.teal} />
        </linearGradient>
      </defs>
      <path
        d={arcPath(cx, cy, r, -90, angle(val))}
        fill="none"
        stroke="url(#gaugeg)"
        strokeWidth={16}
        strokeLinecap="round"
        style={{ transition: "all 1200ms cubic-bezier(.22,1,.36,1)" }}
      />
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke={C.ink}
        strokeWidth={3}
        strokeLinecap="round"
        style={{ transition: "all 1200ms cubic-bezier(.22,1,.36,1)" }}
      />
      <circle cx={cx} cy={cy} r={6} fill={C.ink} />
      <text
        x={cx}
        y={cy - 30}
        textAnchor="middle"
        fontSize={30}
        fontWeight={700}
        fontFamily="var(--font-display), sans-serif"
        fill={C.ink}
      >
        {val}%
      </text>
      <text
        x={cx}
        y={cy + 26}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-mono), monospace"
        fill={C.dim}
      >
        bed occupancy
      </text>
    </g>
  );
}
