"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FileDropzone } from "./FileDropzone";
import type { SamplePreset } from "@/lib/demo-samples";
import type { Stat } from "@/lib/report";

const PanelLabel = ({ children }: { children: ReactNode }) => (
  <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
    {children}
  </p>
);

export type DemoShellProps = {
  title: string;
  subtitle: string;
  /** Lower-case noun used in the report footer, e.g. "Sankey". */
  kind: string;
  accept: string;
  formatHelp: ReactNode;
  samples: SamplePreset[];
  activeSample: string | null;
  hasData: boolean;
  fileName?: string;
  rowCount?: number;
  error?: string | null;
  notice?: string | null;
  stats?: Stat[];
  toolbar?: ReactNode;
  exportSlot?: ReactNode;
  onSelectSample: (preset: SamplePreset) => void;
  onLoad: (fileName: string, text: string) => void;
  onError: (message: string) => void;
  children: ReactNode;
};

/** Shared chrome for every interactive demo page: header, sample-data
 *  picker, upload panel, analysis panel and the chart canvas. */
export function DemoShell(p: DemoShellProps) {
  return (
    <main className="relative z-10 min-h-screen">
      {/* top bar */}
      <div className="sticky top-0 z-30 border-b border-white/[0.07] bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-content items-center justify-between px-6 py-3.5">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-text"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 18 9 12l6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to portfolio
          </Link>
          <span className="live-pill">live demo</span>
        </div>
      </div>

      <div className="mx-auto max-w-content px-6 py-8">
        <p className="kicker mb-2">interactive demo</p>
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
          {p.title}
        </h1>
        <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted">
          {p.subtitle}
        </p>

        <div className="mt-7 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* ---- sidebar ---- */}
          <aside className="space-y-5">
            {/* sample data picker */}
            <div>
              <PanelLabel>Sample data</PanelLabel>
              <div className="grid grid-cols-3 gap-1.5">
                {p.samples.map((s) => {
                  const on = p.activeSample === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => p.onSelectSample(s)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                        on
                          ? "border-accent/50 bg-accent/15 text-text"
                          : "border-white/[0.1] bg-white/[0.02] text-muted hover:border-accent/40 hover:text-text"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
                Pick a size to see how the visual scales.
              </p>
            </div>

            {/* upload */}
            <div>
              <PanelLabel>Or upload your own</PanelLabel>
              <FileDropzone
                accept={p.accept}
                onLoad={p.onLoad}
                onError={p.onError}
              />
            </div>

            {p.error ? (
              <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-xs leading-relaxed text-red-300">
                {p.error}
              </div>
            ) : null}

            <div className="glass p-4">
              <PanelLabel>Expected format</PanelLabel>
              <div className="text-xs leading-relaxed text-muted">
                {p.formatHelp}
              </div>
            </div>

            {p.hasData ? (
              <div className="glass p-4">
                <PanelLabel>Loaded</PanelLabel>
                <p className="truncate text-sm text-text">{p.fileName}</p>
                <p className="font-mono text-xs text-faint">
                  {p.rowCount} rows
                  {p.activeSample ? " · built-in sample" : " · your upload"}
                </p>
              </div>
            ) : null}

            {p.hasData && p.stats && p.stats.length ? (
              <div className="glass p-4">
                <PanelLabel>Analysis</PanelLabel>
                <dl className="space-y-2">
                  {p.stats.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <dt className="text-xs text-muted">{s.label}</dt>
                      <dd className="text-right font-mono text-xs text-text">
                        {s.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {p.hasData && p.exportSlot ? (
              <div className="glass p-4">
                <PanelLabel>Export</PanelLabel>
                <div className="space-y-2">{p.exportSlot}</div>
              </div>
            ) : null}
          </aside>

          {/* ---- canvas ---- */}
          <section className="min-w-0">
            {p.hasData && p.toolbar ? (
              <div className="mb-3">{p.toolbar}</div>
            ) : null}
            {p.hasData && p.notice ? (
              <div className="mb-3 rounded-lg border border-accent/25 bg-accent/10 p-2.5 text-xs text-accent">
                {p.notice}
              </div>
            ) : null}
            <div className="glass overflow-hidden p-3 sm:p-4">{p.children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}

/** Placeholder shown in the canvas if data ever fails to load. */
export function DemoEmpty({ hint }: { hint: string }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
      <svg
        width="46"
        height="46"
        viewBox="0 0 24 24"
        fill="none"
        className="text-faint"
        aria-hidden
      >
        <path
          d="M4 6a2 2 0 0 1 2-2h7l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M13 4v5h5M8 13h8M8 17h5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <p className="mt-4 text-sm font-medium text-muted">No data to show</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-faint">{hint}</p>
    </div>
  );
}

/** Small button used inside the export panel. */
export function ExportButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.03] px-3 py-2 text-xs font-medium text-text transition-colors hover:border-accent/50 hover:bg-accent/10"
    >
      {children}
    </button>
  );
}
