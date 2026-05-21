"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { DemoEmpty, DemoShell, ExportButton } from "./DemoShell";
import { DemoSelect, type SelectOption } from "./DemoSelect";
import { DemoTooltip, tooltipAnchor, type TooltipModel } from "./DemoTooltip";
import { formatNumber, formatPercent, parseTable, toNumber, type Table } from "@/lib/csv";
import {
  analyzeTable,
  matrixStats,
  aggregate,
  AGG_LABELS,
  type AggFn,
} from "@/lib/matrix";
import { buildHtmlReport, downloadBlob, tableToCsv } from "@/lib/report";
import { MATRIX_SAMPLES, type SamplePreset } from "@/lib/demo-samples";

type Mode = "bars" | "heat" | "plain";
type Sort = { index: number; dir: 1 | -1 };
/** How a numeric cell is expressed — raw figure or a derived metric. */
type ShowAs = "raw" | "pctcol" | "pctrow" | "rank";
type Cursor = { clientX: number; clientY: number };
/** A bucket of rows sharing the same value in the group-by column. */
type Group = { key: string; rows: string[][] };

const ROW_CAP = 400;
const DEFAULT = MATRIX_SAMPLES[1];
const MODES: { id: Mode; label: string }[] = [
  { id: "bars", label: "Bars" },
  { id: "heat", label: "Heat-map" },
  { id: "plain", label: "Plain" },
];
const AGG_OPTIONS: AggFn[] = ["sum", "avg", "min", "max", "count"];
const SHOW_AS: { id: ShowAs; label: string }[] = [
  { id: "raw", label: "Values" },
  { id: "pctcol", label: "% of column" },
  { id: "pctrow", label: "% of row" },
  { id: "rank", label: "Rank in column" },
];

const CTRL =
  "rounded-lg border border-white/[0.12] bg-white/[0.03] px-2.5 py-1.5 text-xs text-text outline-none focus:border-accent/50";

/** Compact label + control pair used across the toolbar. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
        {label}
      </span>
      {children}
    </span>
  );
}

/** Mini trend line across a row's numeric values. */
function sparkPath(values: number[]): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 64;
  const h = 18;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function MatrixDemo() {
  const initialTable = useMemo<Table | null>(() => {
    try {
      return parseTable(DEFAULT.fileName, DEFAULT.csv);
    } catch {
      return null;
    }
  }, []);

  const [table, setTable] = useState<Table | null>(initialTable);
  const [fileName, setFileName] = useState(DEFAULT.fileName);
  const [activeSample, setActiveSample] = useState<string | null>(DEFAULT.id);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("bars");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort | null>(null);
  const [groupCol, setGroupCol] = useState<number | null>(null);
  const [agg, setAgg] = useState<AggFn>("sum");
  const [showAs, setShowAs] = useState<ShowAs>("raw");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<TooltipModel | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const ingest = (name: string, text: string): boolean => {
    try {
      const t = parseTable(name, text);
      setTable(t);
      setFileName(name);
      setError(null);
      setSort(null);
      setQuery("");
      setGroupCol(null);
      setAgg("sum");
      setShowAs("raw");
      setCollapsed(new Set());
      setTooltip(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "That file could not be read.");
      return false;
    }
  };

  const onSelectSample = (preset: SamplePreset) => {
    if (ingest(preset.fileName, preset.csv)) setActiveSample(preset.id);
  };
  const onUpload = (name: string, text: string) => {
    if (ingest(name, text)) setActiveSample(null);
  };

  const analysis = useMemo(() => (table ? analyzeTable(table) : null), [table]);

  // Numeric values per column — drives the per-cell rank in tooltip + "rank" view.
  const colValues = useMemo(() => {
    const m = new Map<number, number[]>();
    if (table && analysis) {
      for (const ci of analysis.numericIndexes) {
        const vals: number[] = [];
        for (const row of table.rows) {
          const v = toNumber(row[ci]);
          if (v != null) vals.push(v);
        }
        m.set(ci, vals);
      }
    }
    return m;
  }, [table, analysis]);

  const processed = useMemo(() => {
    if (!table) return [] as string[][];
    let rows = table.rows;
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => r.some((c) => c.toLowerCase().includes(q)));
    }
    if (sort && analysis) {
      const { index, dir } = sort;
      const numeric = analysis.columns[index]?.numeric;
      rows = [...rows].sort((a, b) => {
        if (numeric) {
          const av = toNumber(a[index]);
          const bv = toNumber(b[index]);
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          return (av - bv) * dir;
        }
        return (a[index] ?? "").localeCompare(b[index] ?? "") * dir;
      });
    }
    return rows;
  }, [table, analysis, query, sort]);

  // Columns shown in the table — the group-by column folds into row headers.
  const visibleCols = useMemo(() => {
    const all = table ? table.headers.map((_, i) => i) : [];
    return groupCol == null ? all : all.filter((i) => i !== groupCol);
  }, [table, groupCol]);

  // Rows bucketed by the group-by column, in first-appearance order.
  const groups = useMemo<Group[]>(() => {
    if (groupCol == null) return [];
    const map = new Map<string, string[][]>();
    for (const r of processed) {
      const key = (r[groupCol] ?? "").trim() || "—";
      const bucket = map.get(key);
      if (bucket) bucket.push(r);
      else map.set(key, [r]);
    }
    return [...map.entries()].map(([key, rows]) => ({ key, rows }));
  }, [groupCol, processed]);

  // Grand-total row — the chosen aggregation across every matching row.
  const totals = useMemo(() => {
    const m: Record<number, number> = {};
    if (!analysis) return m;
    for (const i of analysis.numericIndexes) {
      const vals: number[] = [];
      for (const r of processed) {
        const v = toNumber(r[i]);
        if (v != null) vals.push(v);
      }
      m[i] = aggregate(vals, agg);
    }
    return m;
  }, [analysis, processed, agg]);

  const stats = useMemo(() => {
    const base = table && analysis ? matrixStats(table, analysis) : [];
    return groupCol != null
      ? [...base, { label: "Groups", value: String(groups.length) }]
      : base;
  }, [table, analysis, groupCol, groups]);

  const grouped = groupCol != null;
  const showTrend = (analysis?.numericIndexes.length ?? 0) >= 3;
  const visible = processed.slice(0, ROW_CAP);
  const textCols = analysis ? analysis.columns.filter((c) => !c.numeric) : [];
  const allCollapsed =
    grouped && groups.length > 0 && groups.every((g) => collapsed.has(g.key));

  const groupOptions: SelectOption[] = [
    { value: "", label: "No grouping" },
    ...textCols.map((c) => ({ value: String(c.index), label: c.name })),
  ];
  const aggOptions: SelectOption[] = AGG_OPTIONS.map((a) => ({
    value: a,
    label: AGG_LABELS[a],
  }));
  const showAsOptions: SelectOption[] = SHOW_AS.map((s) => ({
    value: s.id,
    label: s.label,
  }));

  const toggleSort = (index: number) => {
    setSort((prev) => {
      if (prev && prev.index === index) {
        return { index, dir: prev.dir === 1 ? -1 : 1 };
      }
      return { index, dir: analysis?.columns[index]?.numeric ? -1 : 1 };
    });
  };

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    setCollapsed(allCollapsed ? new Set() : new Set(groups.map((g) => g.key)));
  };

  /** Aggregates one numeric column across a group's rows. */
  const groupAgg = (rows: string[][], ci: number): number => {
    const vals: number[] = [];
    for (const r of rows) {
      const v = toNumber(r[ci]);
      if (v != null) vals.push(v);
    }
    return aggregate(vals, agg);
  };

  /** Display value for a numeric cell under the current "show as" mode. */
  const cellMetric = (
    raw: string,
    ci: number,
    rowSum: number,
    rowMax: number,
  ): { num: number | null; text: string; norm: number } => {
    const col = analysis!.columns[ci];
    const v = toNumber(raw);
    if (v == null) return { num: null, text: raw || "—", norm: 0 };
    const span = col.max - col.min || 1;
    const clamp = (n: number) => Math.max(0, Math.min(1, n));
    if (showAs === "pctcol") {
      return { num: v, text: formatPercent(v, col.sum), norm: clamp((v - col.min) / span) };
    }
    if (showAs === "pctrow") {
      return { num: v, text: formatPercent(v, rowSum), norm: rowMax ? clamp(v / rowMax) : 0 };
    }
    if (showAs === "rank") {
      const vals = colValues.get(ci) ?? [];
      const rank = vals.reduce((c, x) => c + (x > v ? 1 : 0), 0) + 1;
      return {
        num: v,
        text: `#${rank}`,
        norm: vals.length > 1 ? 1 - (rank - 1) / (vals.length - 1) : 1,
      };
    }
    return { num: v, text: formatNumber(v), norm: clamp((v - col.min) / span) };
  };

  const heatBg = (norm: number) =>
    mode === "heat"
      ? `rgba(76,141,255,${(0.06 + norm * 0.5).toFixed(3)})`
      : undefined;

  const renderMetric = (m: { text: string; norm: number }) => {
    const label = (
      <span className="relative font-mono tabular-nums">{m.text}</span>
    );
    if (mode === "bars") {
      return (
        <span className="relative flex items-center justify-end">
          <span
            className="absolute inset-y-0 right-0 rounded-sm bg-accent/25"
            style={{ width: `${Math.max(m.norm * 100, 2)}%` }}
          />
          {label}
        </span>
      );
    }
    return label;
  };

  const cellTip = (
    rowLabel: string,
    ci: number,
    v: number,
    e: Cursor,
  ): TooltipModel => {
    const col = analysis!.columns[ci];
    const vals = colValues.get(ci) ?? [];
    const rank = vals.reduce((c, x) => c + (x > v ? 1 : 0), 0) + 1;
    const vsAvg = col.avg !== 0 ? ((v - col.avg) / Math.abs(col.avg)) * 100 : 0;
    return {
      ...tooltipAnchor(wrapRef.current, e),
      title: rowLabel || "Row",
      accent: "#4c8dff",
      kicker: col.name,
      rows: [
        { label: "Value", value: formatNumber(v), emphasis: true },
        { label: "Rank in column", value: `#${rank} of ${vals.length}` },
        {
          label: "vs. average",
          value:
            col.avg === 0 ? "—" : `${vsAvg >= 0 ? "+" : ""}${vsAvg.toFixed(1)}%`,
        },
        { label: "Share of column", value: formatPercent(v, col.sum) },
      ],
    };
  };

  const groupTip = (g: Group, ci: number, val: number, e: Cursor): TooltipModel => {
    const col = analysis!.columns[ci];
    const rows: TooltipModel["rows"] = [
      { label: AGG_LABELS[agg], value: formatNumber(val), emphasis: true },
      { label: "Rows in group", value: String(g.rows.length) },
    ];
    if (agg === "sum") {
      rows.push({ label: "Share of column", value: formatPercent(val, col.sum) });
    }
    return {
      ...tooltipAnchor(wrapRef.current, e),
      title: g.key,
      accent: "#3de0c2",
      kicker: `${col.name} · ${AGG_LABELS[agg]}`,
      rows,
    };
  };

  /** Renders the matrix exactly as shown — grouping, aggregation, "show as"
   *  and the active mode all applied — as a self-contained HTML fragment for
   *  the downloadable report. */
  const buildMatrixHtml = (): string => {
    if (!table || !analysis) return "";
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const BB = "border-bottom:1px solid rgba(255,255,255,.06)";

    const spark = (vals: number[]) =>
      vals.length > 1
        ? `<svg viewBox="0 0 64 18" style="display:inline-block;width:64px;height:18px;vertical-align:middle"><path d="${sparkPath(
            vals,
          )}" fill="none" stroke="#3de0c2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        : "";

    /** One numeric detail cell, styled per the active render mode. */
    const numCell = (
      m: { num: number | null; text: string; norm: number },
      pad: string,
    ) => {
      const base = `padding:7px 10px;${pad}${BB};text-align:right;color:#e8edf7;font-variant-numeric:tabular-nums`;
      if (m.num == null)
        return `<td style="${base}"><span style="color:#5a6072">${esc(m.text)}</span></td>`;
      if (mode === "heat")
        return `<td style="${base};background:rgba(76,141,255,${(
          0.06 +
          m.norm * 0.5
        ).toFixed(3)})">${esc(m.text)}</td>`;
      if (mode === "bars") {
        const w = Math.max(m.norm * 100, 2).toFixed(1);
        return `<td style="${base};position:relative"><span style="position:absolute;top:3px;bottom:3px;right:0;width:${w}%;background:rgba(76,141,255,.22);border-radius:3px"></span><span style="position:relative">${esc(
          m.text,
        )}</span></td>`;
      }
      return `<td style="${base}">${esc(m.text)}</td>`;
    };

    /** A single detail row, optionally indented under a group. */
    const dataRow = (r: string[], indent: boolean) => {
      const rowNums = analysis.numericIndexes
        .map((ci) => toNumber(r[ci]))
        .filter((v): v is number => v != null);
      const rowSum = rowNums.reduce((a, b) => a + b, 0);
      const rowMax = rowNums.length ? Math.max(...rowNums) : 0;
      const cells = visibleCols
        .map((ci, vi) => {
          const col = analysis.columns[ci];
          const pad = indent && vi === 0 ? "padding-left:26px;" : "";
          if (!col.numeric) {
            const color = ci === analysis.labelIndex ? "#e8edf7" : "#8a93a6";
            return `<td style="padding:7px 10px;${pad}${BB};color:${color}">${esc(
              r[ci] || "—",
            )}</td>`;
          }
          return numCell(cellMetric(r[ci] ?? "", ci, rowSum, rowMax), pad);
        })
        .join("");
      const trend = showTrend
        ? `<td style="padding:7px 10px;${BB};text-align:right">${spark(rowNums)}</td>`
        : "";
      return `<tr>${cells}${trend}</tr>`;
    };

    /** A group header row carrying that group's subtotals. */
    const groupRow = (g: Group) => {
      const gb =
        "padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.045)";
      const cells = visibleCols
        .map((ci, vi) => {
          if (vi === 0)
            return `<td style="${gb};color:#e8edf7;font-weight:600">${esc(
              g.key,
            )} <span style="color:#5a6072;font-weight:400">(${g.rows.length})</span></td>`;
          if (!analysis.columns[ci].numeric) return `<td style="${gb}"></td>`;
          return `<td style="${gb};text-align:right;color:#3de0c2;font-variant-numeric:tabular-nums">${esc(
            formatNumber(groupAgg(g.rows, ci)),
          )}</td>`;
        })
        .join("");
      const trend = showTrend
        ? `<td style="${gb};text-align:right">${spark(
            analysis.numericIndexes.map((ci) => groupAgg(g.rows, ci)),
          )}</td>`
        : "";
      return `<tr>${cells}${trend}</tr>`;
    };

    const headCells = visibleCols
      .map((ci) => {
        const align = analysis.columns[ci].numeric ? "right" : "left";
        return `<th style="padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.03);color:#cdd5e6;text-align:${align}">${esc(
          table.headers[ci],
        )}</th>`;
      })
      .join("");
    const headTrend = showTrend
      ? `<th style="padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.03);color:#cdd5e6;text-align:right">Trend</th>`
      : "";

    let body = "";
    let shown = 0;
    if (grouped) {
      for (const g of groups) {
        body += groupRow(g);
        if (!collapsed.has(g.key)) {
          for (let i = 0; i < g.rows.length && shown < ROW_CAP; i++, shown++) {
            body += dataRow(g.rows[i], true);
          }
        }
      }
    } else {
      for (const r of processed.slice(0, ROW_CAP)) {
        body += dataRow(r, false);
        shown++;
      }
    }

    let footer = "";
    if (analysis.numericIndexes.length > 0) {
      const cells = visibleCols
        .map((ci, vi) => {
          const numeric = analysis.columns[ci].numeric;
          const labelHere = grouped ? vi === 0 : ci === analysis.labelIndex;
          const color = numeric && !labelHere ? "#3de0c2" : "#8a93a6";
          const text = labelHere
            ? AGG_LABELS[agg]
            : numeric
              ? formatNumber(totals[ci] ?? 0)
              : "";
          return `<td style="padding:8px 10px;border-top:1px solid rgba(255,255,255,.16);color:${color};text-align:${
            numeric ? "right" : "left"
          };font-variant-numeric:tabular-nums">${esc(text)}</td>`;
        })
        .join("");
      const trend = showTrend
        ? `<td style="border-top:1px solid rgba(255,255,255,.16)"></td>`
        : "";
      footer = `<tfoot><tr>${cells}${trend}</tr></tfoot>`;
    }

    const total = processed.length;
    const bits = [
      grouped ? `Grouped by ${esc(table.headers[groupCol!])}` : null,
      `${AGG_LABELS[agg]} totals`,
      showAs !== "raw"
        ? `values shown as ${SHOW_AS.find((s) => s.id === showAs)!.label.toLowerCase()}`
        : null,
      query.trim() ? `filtered by “${esc(query.trim())}”` : null,
    ].filter(Boolean);
    const caption =
      shown < total
        ? `${bits.join(" · ")} — showing the first ${shown} of ${total} rows.`
        : `${bits.join(" · ")}.`;

    return `<table style="border-collapse:collapse;width:100%;font-size:12px;font-family:ui-sans-serif,system-ui,sans-serif">
<thead><tr>${headCells}${headTrend}</tr></thead>
<tbody>${body}</tbody>${footer}</table>
<p style="color:#5a6072;font-size:12px;margin:10px 0 0">${caption}</p>`;
  };

  const downloadReport = () => {
    if (!table || !analysis) return;
    const rows = grouped ? groups.flatMap((g) => g.rows) : processed;
    const html = buildHtmlReport({
      title: "Matrix Data Analysis",
      kind: "matrix table",
      fileName,
      portfolioUrl: window.location.origin,
      stats,
      visualHtml: buildMatrixHtml(),
      headers: table.headers,
      rows,
    });
    downloadBlob("matrix-report.html", new Blob([html], { type: "text/html" }));
  };
  const downloadCsv = () => {
    if (!table) return;
    const rows = grouped ? groups.flatMap((g) => g.rows) : processed;
    downloadBlob(
      "matrix-data.csv",
      new Blob([tableToCsv(table.headers, rows)], { type: "text/csv" }),
    );
  };

  /** A single detail row — used flat or nested under a group. */
  const renderDataRow = (r: string[], key: string) => {
    if (!analysis) return null;
    const rowNums = analysis.numericIndexes
      .map((ci) => toNumber(r[ci]))
      .filter((v): v is number => v != null);
    const rowSum = rowNums.reduce((a, b) => a + b, 0);
    const rowMax = rowNums.length ? Math.max(...rowNums) : 0;
    return (
      <tr
        key={key}
        className="border-b border-white/[0.05] transition-colors hover:bg-white/[0.03]"
      >
        {visibleCols.map((ci, vi) => {
          const col = analysis.columns[ci];
          const pad = grouped && vi === 0 ? "pl-8 pr-3" : "px-3";
          if (!col.numeric) {
            return (
              <td
                key={ci}
                className={`whitespace-nowrap ${pad} py-2 text-left ${
                  ci === analysis.labelIndex
                    ? "font-medium text-text"
                    : "text-muted"
                }`}
              >
                {r[ci] || "—"}
              </td>
            );
          }
          const m = cellMetric(r[ci] ?? "", ci, rowSum, rowMax);
          return (
            <td
              key={ci}
              onMouseEnter={(e) => {
                if (m.num == null) return;
                setTooltip(
                  cellTip(r[analysis.labelIndex] ?? "", ci, m.num, e),
                );
              }}
              className={`whitespace-nowrap ${pad} py-2 text-right text-text`}
              style={{ background: heatBg(m.norm) }}
            >
              {m.num == null ? (
                <span className="text-faint">{m.text}</span>
              ) : (
                renderMetric(m)
              )}
            </td>
          );
        })}
        {showTrend && (
          <td className="px-3 py-2 text-right">
            <svg
              width="64"
              height="18"
              viewBox="0 0 64 18"
              className="inline-block align-middle"
              aria-hidden
            >
              <path
                d={sparkPath(rowNums)}
                fill="none"
                stroke="#3de0c2"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </td>
        )}
      </tr>
    );
  };

  /** A collapsible group header carrying that group's subtotals. */
  const renderGroupRow = (g: Group) => {
    if (!analysis) return null;
    const isCollapsed = collapsed.has(g.key);
    const aggVals = analysis.numericIndexes.map((ci) => groupAgg(g.rows, ci));
    return (
      <tr
        key={`g:${g.key}`}
        onClick={() => toggleGroup(g.key)}
        className="cursor-pointer border-b border-white/10 bg-white/[0.045] transition-colors hover:bg-white/[0.08]"
      >
        {visibleCols.map((ci, vi) => {
          const col = analysis.columns[ci];
          if (vi === 0) {
            return (
              <td
                key={ci}
                className="whitespace-nowrap px-3 py-2.5 text-left font-medium text-text"
              >
                <span className="mr-1.5 inline-block w-3 text-faint">
                  {isCollapsed ? "▸" : "▾"}
                </span>
                {g.key}
                <span className="ml-2 rounded-full bg-white/[0.07] px-1.5 py-0.5 font-mono text-[10px] text-faint">
                  {g.rows.length}
                </span>
              </td>
            );
          }
          if (!col.numeric) return <td key={ci} className="px-3 py-2.5" />;
          const val = groupAgg(g.rows, ci);
          return (
            <td
              key={ci}
              onMouseEnter={(e) => setTooltip(groupTip(g, ci, val, e))}
              className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-xs text-accent3"
            >
              {formatNumber(val)}
            </td>
          );
        })}
        {showTrend && (
          <td className="px-3 py-2.5 text-right">
            <svg
              width="64"
              height="18"
              viewBox="0 0 64 18"
              className="inline-block align-middle"
              aria-hidden
            >
              <path
                d={sparkPath(aggVals)}
                fill="none"
                stroke="#3de0c2"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </td>
        )}
      </tr>
    );
  };

  /** Group headers interleaved with their (expanded) detail rows, capped. */
  const renderGrouped = (): ReactNode[] => {
    const out: ReactNode[] = [];
    let rendered = 0;
    for (const g of groups) {
      out.push(renderGroupRow(g));
      if (!collapsed.has(g.key)) {
        for (let i = 0; i < g.rows.length && rendered < ROW_CAP; i++) {
          out.push(renderDataRow(g.rows[i], `${g.key}::${i}`));
          rendered++;
        }
      }
    }
    return out;
  };

  return (
    <DemoShell
      title="Matrix Data Table"
      subtitle="Turn any spreadsheet into a dense, sortable matrix. Group by any text column for collapsible subtotals, switch the aggregation, and read every figure as a raw value, a share or a rank — with in-cell bars, a heat-map and per-row trend lines."
      kind="Matrix"
      accept=".csv,.tsv,.txt,.json"
      formatHelp={
        <>
          Any table with a header row. The first text column becomes the row
          label; numeric columns get in-cell{" "}
          <code className="text-accent2">bars</code>, a{" "}
          <code className="text-accent2">heat-map</code> and a trend line. Pick a
          text column under <code className="text-accent2">Group</code> to fold
          rows into subtotalled sections.
        </>
      }
      samples={MATRIX_SAMPLES}
      activeSample={activeSample}
      hasData={!!table}
      fileName={fileName}
      rowCount={table?.rows.length}
      error={error}
      notice={
        processed.length > ROW_CAP
          ? `Rendering the first ${ROW_CAP} of ${processed.length} matching rows — group subtotals and the report cover them all.`
          : null
      }
      stats={stats}
      toolbar={
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-white/[0.12] bg-white/[0.03] p-0.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === m.id
                    ? "bg-accent/20 text-text"
                    : "text-muted hover:text-text"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Field label="Group">
            <DemoSelect
              ariaLabel="Group rows by column"
              value={groupCol == null ? "" : String(groupCol)}
              options={groupOptions}
              onChange={(v) => {
                setGroupCol(v === "" ? null : Number(v));
                setCollapsed(new Set());
                setTooltip(null);
              }}
              className="w-[150px]"
            />
          </Field>
          <Field label="Aggregate">
            <DemoSelect
              ariaLabel="Aggregation function"
              value={agg}
              options={aggOptions}
              onChange={(v) => setAgg(v as AggFn)}
              className="w-[118px]"
            />
          </Field>
          <Field label="Show as">
            <DemoSelect
              ariaLabel="Show values as"
              value={showAs}
              options={showAsOptions}
              onChange={(v) => setShowAs(v as ShowAs)}
              className="w-[150px]"
            />
          </Field>
          {grouped && groups.length > 0 && (
            <button
              onClick={toggleAll}
              className={`${CTRL} cursor-pointer hover:border-accent/50 hover:text-text`}
            >
              {allCollapsed ? "Expand all" : "Collapse all"}
            </button>
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter rows…"
            className="ml-auto w-40 rounded-lg border border-white/[0.12] bg-white/[0.03] px-3 py-1.5 text-xs text-text outline-none placeholder:text-faint focus:border-accent/50"
          />
        </div>
      }
      exportSlot={
        <>
          <ExportButton onClick={downloadReport}>
            Download report (HTML)
          </ExportButton>
          <ExportButton onClick={downloadCsv}>Download data (CSV)</ExportButton>
        </>
      }
      onSelectSample={onSelectSample}
      onLoad={onUpload}
      onError={setError}
    >
      {table && analysis ? (
        <div ref={wrapRef} className="relative">
          <div
            className="max-h-[600px] overflow-auto rounded-lg"
            onMouseLeave={() => setTooltip(null)}
          >
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[#0c1220]">
                <tr>
                  {visibleCols.map((ci) => {
                    const numeric = analysis.columns[ci].numeric;
                    const sorted = sort?.index === ci;
                    return (
                      <th
                        key={ci}
                        onClick={() => toggleSort(ci)}
                        className={`cursor-pointer select-none whitespace-nowrap border-b border-white/10 px-3 py-2.5 font-display text-xs font-semibold transition-colors hover:text-accent ${
                          numeric ? "text-right" : "text-left"
                        } ${sorted ? "text-accent" : "text-text"}`}
                      >
                        {table.headers[ci]}
                        <span className="ml-1 text-faint">
                          {sorted ? (sort!.dir === 1 ? "▲" : "▼") : "↕"}
                        </span>
                      </th>
                    );
                  })}
                  {showTrend && (
                    <th className="whitespace-nowrap border-b border-white/10 px-3 py-2.5 text-right font-display text-xs font-semibold text-text">
                      Trend
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {grouped
                  ? renderGrouped()
                  : visible.map((r, ri) => renderDataRow(r, String(ri)))}
              </tbody>
              {analysis.numericIndexes.length > 0 && (
                <tfoot className="sticky bottom-0 bg-[#0c1220]">
                  <tr>
                    {visibleCols.map((ci, vi) => {
                      const numeric = analysis.columns[ci].numeric;
                      const labelHere = grouped
                        ? vi === 0
                        : ci === analysis.labelIndex;
                      return (
                        <td
                          key={ci}
                          className={`whitespace-nowrap border-t border-white/10 px-3 py-2.5 font-mono text-xs ${
                            numeric
                              ? "text-right text-accent3"
                              : "text-left text-faint"
                          }`}
                        >
                          {labelHere
                            ? AGG_LABELS[agg]
                            : numeric
                              ? formatNumber(totals[ci] ?? 0)
                              : ""}
                        </td>
                      );
                    })}
                    {showTrend && <td className="border-t border-white/10" />}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <DemoTooltip model={tooltip} />
        </div>
      ) : (
        <DemoEmpty hint="Pick a sample size on the left, or upload any CSV or spreadsheet export." />
      )}
    </DemoShell>
  );
}
