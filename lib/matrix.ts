// Column type inference + summary stats for the matrix data table.

import type { Table } from "./csv";
import { formatNumber, toNumber } from "./csv";
import type { Stat } from "./report";

export type ColumnInfo = {
  index: number;
  name: string;
  numeric: boolean;
  min: number;
  max: number;
  sum: number;
  avg: number;
};

export type TableAnalysis = {
  columns: ColumnInfo[];
  labelIndex: number;
  numericIndexes: number[];
};

/** Infers, per column, whether it is numeric and its summary statistics. */
export function analyzeTable(t: Table): TableAnalysis {
  const columns: ColumnInfo[] = t.headers.map((name, index) => {
    let numCount = 0;
    let nonEmpty = 0;
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (const r of t.rows) {
      const cell = r[index] ?? "";
      if (cell.trim() === "") continue;
      nonEmpty++;
      const v = toNumber(cell);
      if (v != null) {
        numCount++;
        sum += v;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    const numeric = nonEmpty > 0 && numCount / nonEmpty >= 0.6;
    return {
      index,
      name,
      numeric,
      min: numeric ? min : 0,
      max: numeric ? max : 0,
      sum: numeric ? sum : 0,
      avg: numeric && numCount ? sum / numCount : 0,
    };
  });
  const numericIndexes = columns.filter((c) => c.numeric).map((c) => c.index);
  const firstText = columns.find((c) => !c.numeric);
  return {
    columns,
    labelIndex: firstText ? firstText.index : 0,
    numericIndexes,
  };
}

/** Headline statistics for the sidebar and downloadable report. */
export function matrixStats(t: Table, a: TableAnalysis): Stat[] {
  const grandTotal = a.numericIndexes.reduce(
    (s, i) => s + a.columns[i].sum,
    0,
  );
  const richest = [...a.columns]
    .filter((c) => c.numeric)
    .sort((x, y) => y.sum - x.sum)[0];
  return [
    { label: "Rows", value: String(t.rows.length) },
    { label: "Columns", value: String(t.headers.length) },
    { label: "Numeric columns", value: String(a.numericIndexes.length) },
    { label: "Grand total", value: formatNumber(grandTotal) },
    { label: "Largest column", value: richest ? richest.name : "—" },
  ];
}

/* --------------------------- Aggregation ----------------------------- */

export type AggFn = "sum" | "avg" | "min" | "max" | "count";

export const AGG_LABELS: Record<AggFn, string> = {
  sum: "Sum",
  avg: "Average",
  min: "Minimum",
  max: "Maximum",
  count: "Count",
};

/** Reduces a list of numbers with the chosen aggregation function. */
export function aggregate(values: number[], fn: AggFn): number {
  if (fn === "count") return values.length;
  if (values.length === 0) return 0;
  switch (fn) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
  }
  return 0;
}
