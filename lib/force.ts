// Hand-rolled force-directed graph: O(n²) repulsion, link springs and
// gravity, integrated with velocity damping. No d3-force dependency.

import type { Table } from "./csv";
import { findColumn, toNumber } from "./csv";
import type { Stat } from "./report";

export type Edge = { source: string; target: string; value: number };

/** The largest graph the O(n²) tick stays smooth on. */
export const MAX_NODES = 600;

/** Maps an arbitrary uploaded table to merged undirected edges. */
export function tableToEdges(t: Table): Edge[] {
  const h = t.headers;
  let si = findColumn(h, ["source", "from", "src", "node1", "a"]);
  let ti = findColumn(h, ["target", "to", "destination", "dest", "node2", "b"]);
  const vi = findColumn(h, ["value", "weight", "count", "strength"]);
  if (si < 0) si = 0;
  if (ti < 0) ti = 1;

  const merged = new Map<string, Edge>();
  for (const r of t.rows) {
    const source = (r[si] ?? "").trim();
    const target = (r[ti] ?? "").trim();
    if (!source || !target || source === target) continue;
    const v = vi >= 0 ? toNumber(r[vi]) ?? 1 : 1;
    const k = [source, target].sort().join(" ");
    const ex = merged.get(k);
    if (ex) ex.value += v > 0 ? v : 1;
    else merged.set(k, { source, target, value: v > 0 ? v : 1 });
  }
  return [...merged.values()];
}

export type ForceNode = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  degree: number;
  fixed: boolean;
};
export type ForceEdge = { s: ForceNode; t: ForceNode; value: number };
export type ForceGraph = {
  nodes: ForceNode[];
  edges: ForceEdge[];
  adjacency: Map<string, Set<string>>;
  trimmed: number;
};

/** Builds a simulation-ready graph, trimming to the highest-degree nodes. */
export function buildGraph(
  edges: Edge[],
  width: number,
  height: number,
): ForceGraph {
  const rawDegree = new Map<string, number>();
  edges.forEach((e) => {
    rawDegree.set(e.source, (rawDegree.get(e.source) ?? 0) + 1);
    rawDegree.set(e.target, (rawDegree.get(e.target) ?? 0) + 1);
  });
  let ids = [...rawDegree.keys()];
  let trimmed = 0;
  if (ids.length > MAX_NODES) {
    ids = ids
      .sort((a, b) => (rawDegree.get(b) ?? 0) - (rawDegree.get(a) ?? 0))
      .slice(0, MAX_NODES);
    trimmed = rawDegree.size - MAX_NODES;
  }
  const allow = new Set(ids);

  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.38;
  const nodeMap = new Map<string, ForceNode>();
  // Deterministic ring start position — keeps server and client renders
  // identical (no hydration mismatch); the simulation spreads them out.
  ids.forEach((id, i) => {
    const a = (i / ids.length) * Math.PI * 2;
    nodeMap.set(id, {
      id,
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      vx: 0,
      vy: 0,
      degree: 0,
      fixed: false,
    });
  });

  const fEdges: ForceEdge[] = [];
  const adjacency = new Map<string, Set<string>>();
  edges.forEach((e) => {
    if (!allow.has(e.source) || !allow.has(e.target)) return;
    const s = nodeMap.get(e.source)!;
    const t = nodeMap.get(e.target)!;
    fEdges.push({ s, t, value: e.value });
    s.degree++;
    t.degree++;
    (adjacency.get(s.id) ?? adjacency.set(s.id, new Set()).get(s.id)!).add(t.id);
    (adjacency.get(t.id) ?? adjacency.set(t.id, new Set()).get(t.id)!).add(s.id);
  });

  return { nodes: [...nodeMap.values()], edges: fEdges, adjacency, trimmed };
}

/** Tunable constants for the force simulation — exposed as UI controls. */
export type PhysicsParams = {
  repel: number;
  linkDist: number;
  linkK: number;
  gravity: number;
  friction: number;
};

/** The settled defaults the simulation ships with. */
export const DEFAULT_PHYSICS: PhysicsParams = {
  repel: 2400,
  linkDist: 62,
  linkK: 0.05,
  gravity: 0.03,
  friction: 0.85,
};

/** Advances the simulation one step at the given cooling factor. */
export function tick(
  g: ForceGraph,
  alpha: number,
  width: number,
  height: number,
  physics: PhysicsParams = DEFAULT_PHYSICS,
): void {
  const { nodes, edges } = g;
  const n = nodes.length;
  const cx = width / 2;
  const cy = height / 2;
  const REPEL = physics.repel;
  const LINK_DIST = physics.linkDist;
  const LINK_K = physics.linkK;
  const GRAVITY = physics.gravity;
  const FRICTION = physics.friction;

  const fx = new Float64Array(n);
  const fy = new Float64Array(n);
  const idx = new Map<ForceNode, number>();
  nodes.forEach((node, i) => idx.set(node, i));

  // pairwise repulsion
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let dx = nodes[j].x - nodes[i].x;
      let dy = nodes[j].y - nodes[i].y;
      let d2 = dx * dx + dy * dy;
      if (d2 < 25) {
        if (d2 === 0) {
          dx = (i % 7) - 3 + 0.5;
          dy = (j % 7) - 3 + 0.5;
        }
        d2 = 25;
      }
      const d = Math.sqrt(d2);
      const f = REPEL / d2;
      const ux = dx / d;
      const uy = dy / d;
      fx[i] -= ux * f;
      fy[i] -= uy * f;
      fx[j] += ux * f;
      fy[j] += uy * f;
    }
  }

  // link springs
  for (const e of edges) {
    const i = idx.get(e.s)!;
    const j = idx.get(e.t)!;
    const dx = e.t.x - e.s.x;
    const dy = e.t.y - e.s.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const f = (d - LINK_DIST) * LINK_K;
    const ux = dx / d;
    const uy = dy / d;
    fx[i] += ux * f;
    fy[i] += uy * f;
    fx[j] -= ux * f;
    fy[j] -= uy * f;
  }

  // gravity toward center + integration
  nodes.forEach((node, i) => {
    if (node.fixed) {
      node.vx = 0;
      node.vy = 0;
      return;
    }
    fx[i] += (cx - node.x) * GRAVITY;
    fy[i] += (cy - node.y) * GRAVITY;
    node.vx = (node.vx + fx[i] * alpha) * FRICTION;
    node.vy = (node.vy + fy[i] * alpha) * FRICTION;
    const sp = Math.hypot(node.vx, node.vy);
    if (sp > 22) {
      node.vx = (node.vx / sp) * 22;
      node.vy = (node.vy / sp) * 22;
    }
    node.x = Math.max(10, Math.min(width - 10, node.x + node.vx));
    node.y = Math.max(10, Math.min(height - 10, node.y + node.vy));
  });
}

/** Headline statistics for the sidebar and downloadable report. */
export function networkStats(g: ForceGraph): Stat[] {
  const n = g.nodes.length;
  const e = g.edges.length;
  const maxEdges = (n * (n - 1)) / 2;
  const density = maxEdges > 0 ? e / maxEdges : 0;
  const top = [...g.nodes].sort((a, b) => b.degree - a.degree)[0];
  const avg = n ? (e * 2) / n : 0;
  return [
    { label: "Nodes", value: String(n) },
    { label: "Connections", value: String(e) },
    { label: "Avg. degree", value: avg.toFixed(1) },
    {
      label: "Most connected",
      value: top ? `${top.id} · ${top.degree}` : "—",
    },
    { label: "Density", value: (density * 100).toFixed(1) + "%" },
  ];
}
