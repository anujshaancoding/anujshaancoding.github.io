// Hand-rolled Sankey layout — node layering with selectable alignment,
// value scaling, crossing reduction / explicit sorting, small-flow
// aggregation and ribbon attachment offsets. No d3 dependency.

import type { Table } from "./csv";
import { findColumn, formatNumber, toNumber } from "./csv";
import type { Stat } from "./report";

export type SankeyLink = { source: string; target: string; value: number };
export type SankeyAlign = "left" | "right" | "center" | "justify";
export type SankeySort = "auto" | "value" | "name" | "input";

const PALETTE = [
  "#4c8dff",
  "#9a6bff",
  "#3de0c2",
  "#f0a868",
  "#e26d9b",
  "#5fd0e8",
  "#b6d36b",
];
const OTHER_COLOR = "#697089";
export const OTHER_ID = "Other";

/** Maps an arbitrary uploaded table to merged source→target→value links. */
export function tableToLinks(t: Table): SankeyLink[] {
  const h = t.headers;
  let si = findColumn(h, ["source", "from", "src", "origin"]);
  let ti = findColumn(h, ["target", "to", "destination", "dest"]);
  let vi = findColumn(h, [
    "value",
    "amount",
    "weight",
    "count",
    "flow",
    "quantity",
    "qty",
  ]);
  if (si < 0) si = 0;
  if (ti < 0) ti = 1;
  if (vi < 0) {
    vi = h.findIndex(
      (_, i) =>
        i !== si && i !== ti && t.rows.some((r) => toNumber(r[i]) != null),
    );
  }

  const merged = new Map<string, SankeyLink>();
  for (const r of t.rows) {
    const source = (r[si] ?? "").trim();
    const target = (r[ti] ?? "").trim();
    if (!source || !target || source === target) continue;
    const value = vi >= 0 ? toNumber(r[vi]) ?? 0 : 1;
    if (value <= 0) continue;
    const k = source + " " + target;
    const ex = merged.get(k);
    if (ex) ex.value += value;
    else merged.set(k, { source, target, value });
  }
  return [...merged.values()];
}

export type SankeyNode = {
  id: string;
  depth: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  value: number;
  color: string;
  isOther: boolean;
};

/** A flow link, described by where it attaches relative to each node's
 *  top edge — so paths can be re-routed when a node is dragged. */
export type SankeyFlow = {
  source: string;
  target: string;
  value: number;
  width: number;
  sourceColor: string;
  targetColor: string;
  sourceOffset: number;
  targetOffset: number;
};

export type SankeyOptions = {
  /** Length of the stage axis. */
  depthSpan: number;
  /** Length of the perpendicular (stacking) axis. */
  crossSpan: number;
  nodeWidth: number;
  align: SankeyAlign;
  sort: SankeySort;
  /** Flows below this value are rolled into an "Other" node. */
  minFlow: number;
};

export type SankeyLayout = {
  nodes: SankeyNode[];
  flows: SankeyFlow[];
  columns: number;
  hiddenFlows: number;
};

/** Computes a full Sankey layout in (x = depth, y = cross) coordinates. */
export function computeSankey(
  rawLinks: SankeyLink[],
  opts: SankeyOptions,
): SankeyLayout {
  const { depthSpan, crossSpan, nodeWidth, align, sort, minFlow } = opts;
  const PAD = 14;
  const MT = 12;
  const innerH = crossSpan - MT * 2;

  // --- roll small flows into a single "Other" node ---
  let links = rawLinks;
  let hiddenFlows = 0;
  if (minFlow > 0) {
    const big: SankeyLink[] = [];
    const otherBySource = new Map<string, number>();
    for (const l of rawLinks) {
      if (l.value >= minFlow) {
        big.push(l);
      } else {
        otherBySource.set(
          l.source,
          (otherBySource.get(l.source) ?? 0) + l.value,
        );
        hiddenFlows++;
      }
    }
    otherBySource.forEach((value, source) =>
      big.push({ source, target: OTHER_ID, value }),
    );
    links = big;
  }
  if (!links.length) {
    return { nodes: [], flows: [], columns: 0, hiddenFlows };
  }

  // --- collect nodes (insertion order) ---
  const nodeMap = new Map<string, SankeyNode>();
  const order: string[] = [];
  links.forEach((l) => {
    [l.source, l.target].forEach((id) => {
      if (!nodeMap.has(id)) {
        nodeMap.set(id, {
          id,
          depth: 0,
          x0: 0,
          x1: 0,
          y0: 0,
          y1: 0,
          value: 0,
          color: "#4c8dff",
          isOther: id === OTHER_ID,
        });
        order.push(id);
      }
    });
  });
  const nodes = order.map((id) => nodeMap.get(id)!);
  const orderIdx = new Map(order.map((id, i) => [id, i]));

  // --- adjacency ---
  const outg = new Map<string, SankeyLink[]>();
  const inc = new Map<string, SankeyLink[]>();
  const push = (m: Map<string, SankeyLink[]>, k: string, v: SankeyLink) => {
    const a = m.get(k);
    if (a) a.push(v);
    else m.set(k, [v]);
  };
  links.forEach((l) => {
    push(outg, l.source, l);
    push(inc, l.target, l);
  });

  // --- depth: longest path from sources (dL) and to sinks (dR) ---
  const cap = nodes.length - 1;
  const dL = new Map<string, number>();
  const dR = new Map<string, number>();
  nodes.forEach((n) => {
    dL.set(n.id, 0);
    dR.set(n.id, 0);
  });
  for (let i = 0; i < nodes.length; i++) {
    let changed = false;
    for (const l of links) {
      const v = (dL.get(l.source) ?? 0) + 1;
      if (v > (dL.get(l.target) ?? 0)) {
        dL.set(l.target, Math.min(v, cap));
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (let i = 0; i < nodes.length; i++) {
    let changed = false;
    for (const l of links) {
      const v = (dR.get(l.target) ?? 0) + 1;
      if (v > (dR.get(l.source) ?? 0)) {
        dR.set(l.source, Math.min(v, cap));
        changed = true;
      }
    }
    if (!changed) break;
  }
  const maxDepth = nodes.reduce((m, n) => Math.max(m, dL.get(n.id) ?? 0), 0);
  nodes.forEach((n) => {
    const left = dL.get(n.id) ?? 0;
    const right = maxDepth - (dR.get(n.id) ?? 0);
    if (align === "left") n.depth = left;
    else if (align === "right") n.depth = right;
    else if (align === "center") n.depth = Math.round((left + right) / 2);
    else n.depth = !outg.has(n.id) && maxDepth > 0 ? maxDepth : left;
  });
  // Guarantee every link flows strictly forward (a node is always at least
  // one column before its targets) — fixes rare center-align rounding ties
  // that would otherwise route a ribbon backwards.
  for (let i = 0; i < nodes.length; i++) {
    let changed = false;
    for (const l of links) {
      const s = nodeMap.get(l.source)!;
      const t = nodeMap.get(l.target)!;
      if (t.depth <= s.depth) {
        t.depth = s.depth + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  const columns = nodes.reduce((m, n) => Math.max(m, n.depth), 0) + 1;

  // --- node values & colours ---
  nodes.forEach((n) => {
    const out = (outg.get(n.id) ?? []).reduce((a, l) => a + l.value, 0);
    const inn = (inc.get(n.id) ?? []).reduce((a, l) => a + l.value, 0);
    n.value = Math.max(out, inn, 1e-4);
  });
  let paletteIdx = 0;
  nodes.forEach((n) => {
    n.color = n.isOther ? OTHER_COLOR : PALETTE[paletteIdx++ % PALETTE.length];
  });

  // --- x positions ---
  nodes.forEach((n) => {
    n.x0 =
      columns <= 1 ? 0 : (n.depth / (columns - 1)) * (depthSpan - nodeWidth);
    n.x1 = n.x0 + nodeWidth;
  });

  // --- vertical scale: tallest column fills the height ---
  const byCol: SankeyNode[][] = Array.from({ length: columns }, () => []);
  nodes.forEach((n) => byCol[n.depth].push(n));
  let ky = Infinity;
  byCol.forEach((col) => {
    const sum = col.reduce((a, n) => a + n.value, 0);
    const avail = innerH - (col.length - 1) * PAD;
    if (sum > 0 && avail > 0) ky = Math.min(ky, avail / sum);
  });
  if (!Number.isFinite(ky) || ky <= 0) ky = 1;

  // --- order nodes within each column ---
  if (sort === "value") {
    byCol.forEach((col) => col.sort((a, b) => b.value - a.value));
  } else if (sort === "name") {
    byCol.forEach((col) => col.sort((a, b) => a.id.localeCompare(b.id)));
  } else if (sort === "input") {
    byCol.forEach((col) =>
      col.sort(
        (a, b) => (orderIdx.get(a.id) ?? 0) - (orderIdx.get(b.id) ?? 0),
      ),
    );
  }

  // --- initial stacking (centered per column) ---
  byCol.forEach((col) => {
    const stackH =
      col.reduce((a, n) => a + n.value * ky, 0) + (col.length - 1) * PAD;
    let y = MT + Math.max(0, (innerH - stackH) / 2);
    col.forEach((n) => {
      n.y0 = y;
      n.y1 = y + n.value * ky;
      y = n.y1 + PAD;
    });
  });

  const center = (n: SankeyNode) => (n.y0 + n.y1) / 2;
  const resolve = (col: SankeyNode[]) => {
    col.sort((a, b) => a.y0 - b.y0);
    let y = MT;
    for (const n of col) {
      const h = n.y1 - n.y0;
      if (n.y0 < y) {
        n.y0 = y;
        n.y1 = y + h;
      }
      y = n.y1 + PAD;
    }
    let bottom = MT + innerH;
    for (let i = col.length - 1; i >= 0; i--) {
      const n = col[i];
      const h = n.y1 - n.y0;
      if (n.y1 > bottom) {
        n.y1 = bottom;
        n.y0 = bottom - h;
      }
      bottom = n.y0 - PAD;
    }
  };

  // --- crossing reduction (auto) keeps explicit sorts untouched ---
  if (sort === "auto") {
    for (let pass = 0; pass < 6; pass++) {
      for (const col of byCol) {
        for (const n of col) {
          const linked = [
            ...(inc.get(n.id) ?? []).map((l) => ({
              o: nodeMap.get(l.source)!,
              w: l.value,
            })),
            ...(outg.get(n.id) ?? []).map((l) => ({
              o: nodeMap.get(l.target)!,
              w: l.value,
            })),
          ];
          if (!linked.length) continue;
          const wsum = linked.reduce((a, x) => a + x.w, 0) || 1;
          const goal =
            linked.reduce((a, x) => a + center(x.o) * x.w, 0) / wsum;
          const dy = goal - center(n);
          n.y0 += dy;
          n.y1 += dy;
        }
        resolve(col);
      }
    }
  } else {
    byCol.forEach(resolve);
  }

  // --- ribbon endpoints: stack links inside each node band ---
  const linkSY = new Map<SankeyLink, number>();
  const linkTY = new Map<SankeyLink, number>();
  for (const n of nodes) {
    const out = (outg.get(n.id) ?? [])
      .slice()
      .sort(
        (a, b) =>
          center(nodeMap.get(a.target)!) - center(nodeMap.get(b.target)!),
      );
    let off = 0;
    for (const l of out) {
      linkSY.set(l, n.y0 + off + (l.value * ky) / 2);
      off += l.value * ky;
    }
    const into = (inc.get(n.id) ?? [])
      .slice()
      .sort(
        (a, b) =>
          center(nodeMap.get(a.source)!) - center(nodeMap.get(b.source)!),
      );
    off = 0;
    for (const l of into) {
      linkTY.set(l, n.y0 + off + (l.value * ky) / 2);
      off += l.value * ky;
    }
  }

  const flows: SankeyFlow[] = links.map((l) => {
    const s = nodeMap.get(l.source)!;
    const t = nodeMap.get(l.target)!;
    const sy = linkSY.get(l) ?? center(s);
    const ty = linkTY.get(l) ?? center(t);
    return {
      source: l.source,
      target: l.target,
      value: l.value,
      width: Math.max(l.value * ky, 1),
      sourceColor: s.color,
      targetColor: t.color,
      sourceOffset: sy - s.y0,
      targetOffset: ty - t.y0,
    };
  });

  return { nodes, flows, columns, hiddenFlows };
}

/** Headline statistics for the sidebar and downloadable report. */
export function sankeyStats(links: SankeyLink[]): Stat[] {
  const nodes = new Set<string>();
  let total = 0;
  const through = new Map<string, number>();
  for (const l of links) {
    nodes.add(l.source);
    nodes.add(l.target);
    total += l.value;
    through.set(l.source, (through.get(l.source) ?? 0) + l.value);
    through.set(l.target, (through.get(l.target) ?? 0) + l.value);
  }
  const top = [...through.entries()].sort((a, b) => b[1] - a[1])[0];
  const biggest = [...links].sort((a, b) => b.value - a.value)[0];
  return [
    { label: "Flows", value: String(links.length) },
    { label: "Nodes", value: String(nodes.size) },
    { label: "Total volume", value: formatNumber(total) },
    {
      label: "Busiest node",
      value: top ? `${top[0]} · ${formatNumber(top[1])}` : "—",
    },
    {
      label: "Largest flow",
      value: biggest ? `${biggest.source} → ${biggest.target}` : "—",
    },
  ];
}
