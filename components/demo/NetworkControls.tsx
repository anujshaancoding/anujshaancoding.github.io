"use client";

import type { ReactNode } from "react";
import type { PhysicsParams } from "@/lib/force";
import type { Metric, SizeMetric } from "@/lib/graph-analytics";

type SliderSpec = {
  key: keyof PhysicsParams;
  label: string;
  min: number;
  max: number;
  step: number;
};

/** Force constants exposed to the visitor, with safe slider bounds. */
const SLIDERS: SliderSpec[] = [
  { key: "repel", label: "Repulsion", min: 600, max: 6000, step: 100 },
  { key: "linkDist", label: "Link length", min: 24, max: 160, step: 4 },
  { key: "linkK", label: "Link strength", min: 0.01, max: 0.18, step: 0.005 },
  { key: "gravity", label: "Gravity", min: 0, max: 0.12, step: 0.005 },
  { key: "friction", label: "Friction", min: 0.6, max: 0.95, step: 0.01 },
];

const COLOR_OPTS: { value: Metric; label: string }[] = [
  { value: "degree", label: "Degree" },
  { value: "betweenness", label: "Betweenness" },
  { value: "closeness", label: "Closeness" },
  { value: "community", label: "Community" },
];
const SIZE_OPTS: { value: SizeMetric; label: string }[] = [
  { value: "degree", label: "Degree" },
  { value: "betweenness", label: "Betweenness" },
  { value: "closeness", label: "Closeness" },
];

const fmt = (v: number) =>
  Number.isInteger(v) ? String(v) : v.toFixed(v < 1 ? 3 : 1);

export type NetworkControlsProps = {
  query: string;
  onQuery: (v: string) => void;
  onSearchSubmit: () => void;
  colorBy: Metric;
  onColorBy: (m: Metric) => void;
  sizeBy: SizeMetric;
  onSizeBy: (m: SizeMetric) => void;
  minDegree: number;
  maxDegree: number;
  onMinDegree: (n: number) => void;
  hiddenCount: number;
  physics: PhysicsParams;
  onPhysics: (p: PhysicsParams) => void;
  onResetPhysics: () => void;
  showPhysics: boolean;
  onTogglePhysics: () => void;
  onRerun: () => void;
};

/** The control surface above the network canvas: find, encode, tune. */
export function NetworkControls(p: NetworkControlsProps) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
      {/* row 1 — find + visual encoding */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="m20 20-3.5-3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={p.query}
            onChange={(e) => p.onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") p.onSearchSubmit();
            }}
            placeholder="Search nodes…"
            aria-label="Search nodes"
            className="w-48 rounded-lg border border-white/[0.1] bg-white/[0.04] py-1.5 pl-7 pr-2 text-xs text-text outline-none transition-colors placeholder:text-faint focus:border-accent/50"
          />
        </div>

        <Select
          label="Colour"
          value={p.colorBy}
          options={COLOR_OPTS}
          onChange={(v) => p.onColorBy(v as Metric)}
        />
        <Select
          label="Size"
          value={p.sizeBy}
          options={SIZE_OPTS}
          onChange={(v) => p.onSizeBy(v as SizeMetric)}
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={p.onTogglePhysics}
            aria-expanded={p.showPhysics}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              p.showPhysics
                ? "border-accent/50 bg-accent/10 text-text"
                : "border-white/[0.12] bg-white/[0.03] text-text hover:border-accent/50 hover:bg-accent/10"
            }`}
          >
            Physics
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className={`transition-transform ${p.showPhysics ? "rotate-180" : ""}`}
            >
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={p.onRerun}
            className="rounded-lg border border-white/[0.12] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-accent/50 hover:bg-accent/10"
          >
            Re-run layout
          </button>
        </div>
      </div>

      {/* row 2 — physics + filter, collapsible */}
      {p.showPhysics ? (
        <div className="mt-3 border-t border-white/[0.07] pt-3">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Force simulation
            </span>
            <button
              onClick={p.onResetPhysics}
              className="text-[11px] text-muted transition-colors hover:text-accent3"
            >
              Reset to defaults
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
            {SLIDERS.map((s) => (
              <Slider
                key={s.key}
                label={s.label}
                value={p.physics[s.key]}
                min={s.min}
                max={s.max}
                step={s.step}
                onChange={(v) => p.onPhysics({ ...p.physics, [s.key]: v })}
              />
            ))}
          </div>

          <div className="mt-3.5 border-t border-white/[0.07] pt-3">
            <Slider
              label="Hide nodes below this many connections"
              value={p.minDegree}
              min={1}
              max={Math.max(2, p.maxDegree)}
              step={1}
              onChange={p.onMinDegree}
              note={
                p.hiddenCount > 0
                  ? `${p.hiddenCount} node${p.hiddenCount === 1 ? "" : "s"} hidden`
                  : "showing all nodes"
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-1.5 text-xs text-text outline-none transition-colors focus:border-accent/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-panel text-text">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  note,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  note?: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[11px] leading-tight text-muted">{label}</span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-text">
          {note ?? fmt(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-accent"
      />
    </label>
  );
}
