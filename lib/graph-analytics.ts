// Graph analytics for the network demo — centrality and community
// detection, plus a plain-English read of the result. Dependency-free.
//
//  - Betweenness + closeness centrality: Brandes' algorithm, one BFS sweep.
//  - Communities: single-level Louvain modularity optimisation.
//
// All O(V·E) or better — comfortable for the demo's 600-node ceiling.

import type { ForceGraph } from "./force";

/** A node attribute that can drive size encoding. */
export type SizeMetric = "degree" | "betweenness" | "closeness";
/** Any node attribute that can drive colour encoding. */
export type Metric = SizeMetric | "community";

export type Analytics = {
  /** Betweenness centrality, normalised so the peak node is 1. */
  betweenness: Map<string, number>;
  /** Closeness centrality, normalised so the peak node is 1. */
  closeness: Map<string, number>;
  /** Community index per node — 0 is the largest community. */
  community: Map<string, number>;
  communityCount: number;
  /** Member counts per community, largest first. */
  communitySizes: number[];
};

/**
 * Brandes' algorithm: accumulates betweenness while every BFS also yields
 * the distance sums needed for closeness — both centralities in one pass.
 */
function centrality(g: ForceGraph): {
  betweenness: Map<string, number>;
  closeness: Map<string, number>;
} {
  const nodes = g.nodes;
  const n = nodes.length;
  const index = new Map<string, number>();
  nodes.forEach((nd, i) => index.set(nd.id, i));

  // Integer adjacency — faster inner loops than Map<string> lookups.
  const adj: number[][] = nodes.map(() => []);
  nodes.forEach((nd, i) => {
    g.adjacency.get(nd.id)?.forEach((other) => {
      const j = index.get(other);
      if (j !== undefined) adj[i].push(j);
    });
  });

  const betw = new Float64Array(n);
  const close = new Float64Array(n);
  const sigma = new Float64Array(n);
  const dist = new Int32Array(n);
  const delta = new Float64Array(n);
  const queue = new Int32Array(n);
  const stack = new Int32Array(n);
  const pred: number[][] = nodes.map(() => []);

  for (let s = 0; s < n; s++) {
    for (let i = 0; i < n; i++) {
      sigma[i] = 0;
      dist[i] = -1;
      delta[i] = 0;
      pred[i].length = 0;
    }
    sigma[s] = 1;
    dist[s] = 0;
    let qh = 0;
    let qt = 0;
    let sp = 0;
    queue[qt++] = s;
    let distSum = 0;
    let reached = 0;

    while (qh < qt) {
      const v = queue[qh++];
      stack[sp++] = v;
      if (v !== s) {
        distSum += dist[v];
        reached++;
      }
      const dv = dist[v];
      for (const w of adj[v]) {
        if (dist[w] < 0) {
          dist[w] = dv + 1;
          queue[qt++] = w;
        }
        if (dist[w] === dv + 1) {
          sigma[w] += sigma[v];
          pred[w].push(v);
        }
      }
    }

    // Component-aware closeness — rewards nodes that reach many others fast.
    if (distSum > 0 && n > 1) {
      close[s] = (reached / (n - 1)) * (reached / distSum);
    }

    while (sp > 0) {
      const w = stack[--sp];
      for (const v of pred[w]) {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      }
      if (w !== s) betw[w] += delta[w];
    }
  }

  let bMax = 0;
  let cMax = 0;
  for (let i = 0; i < n; i++) {
    if (betw[i] > bMax) bMax = betw[i];
    if (close[i] > cMax) cMax = close[i];
  }
  const betweenness = new Map<string, number>();
  const closeness = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    betweenness.set(nodes[i].id, bMax > 0 ? betw[i] / bMax : 0);
    closeness.set(nodes[i].id, cMax > 0 ? close[i] / cMax : 0);
  }
  return { betweenness, closeness };
}

/**
 * Single-level Louvain: every node starts in its own community, then each
 * node repeatedly moves to whichever neighbouring community gives the
 * largest modularity gain, until the partition stops changing.
 */
function detectCommunities(g: ForceGraph): {
  community: Map<string, number>;
  communityCount: number;
  communitySizes: number[];
} {
  const nodes = g.nodes;
  const n = nodes.length;
  const community = new Map<string, number>();
  if (n === 0) return { community, communityCount: 0, communitySizes: [] };

  const index = new Map<string, number>();
  nodes.forEach((nd, i) => index.set(nd.id, i));

  const nbr: Map<number, number>[] = nodes.map(() => new Map());
  const k = new Float64Array(n); // weighted degree
  let m = 0; // total edge weight

  for (const e of g.edges) {
    const i = index.get(e.s.id);
    const j = index.get(e.t.id);
    if (i === undefined || j === undefined || i === j) continue;
    const w = e.value > 0 ? e.value : 1;
    nbr[i].set(j, (nbr[i].get(j) ?? 0) + w);
    nbr[j].set(i, (nbr[j].get(i) ?? 0) + w);
    k[i] += w;
    k[j] += w;
    m += w;
  }

  if (m === 0) {
    nodes.forEach((nd) => community.set(nd.id, 0));
    return { community, communityCount: 1, communitySizes: [n] };
  }

  const comm = new Int32Array(n);
  for (let i = 0; i < n; i++) comm[i] = i;
  const sigmaTot = Float64Array.from(k); // Σ weighted degree per community
  const twoM2 = 2 * m * m;

  let moved = true;
  let passes = 0;
  while (moved && passes < 24) {
    moved = false;
    passes++;
    for (let i = 0; i < n; i++) {
      const ci = comm[i];
      sigmaTot[ci] -= k[i];

      // Sum of edge weight from i into each candidate community.
      const kIn = new Map<number, number>();
      for (const [j, w] of nbr[i]) {
        const cj = comm[j];
        kIn.set(cj, (kIn.get(cj) ?? 0) + w);
      }

      let best = ci;
      let bestGain =
        (kIn.get(ci) ?? 0) / m - (sigmaTot[ci] * k[i]) / twoM2;
      for (const [c, w] of kIn) {
        if (c === ci) continue;
        const gain = w / m - (sigmaTot[c] * k[i]) / twoM2;
        if (gain > bestGain) {
          bestGain = gain;
          best = c;
        }
      }

      comm[i] = best;
      sigmaTot[best] += k[i];
      if (best !== ci) moved = true;
    }
  }

  // Relabel so community 0 is the largest, 1 the next, and so on.
  const sizeByOld = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    sizeByOld.set(comm[i], (sizeByOld.get(comm[i]) ?? 0) + 1);
  }
  const order = [...sizeByOld.entries()].sort((a, b) => b[1] - a[1]);
  const remap = new Map<number, number>();
  order.forEach(([old], idx) => remap.set(old, idx));
  for (let i = 0; i < n; i++) {
    community.set(nodes[i].id, remap.get(comm[i]) ?? 0);
  }

  return {
    community,
    communityCount: order.length,
    communitySizes: order.map(([, size]) => size),
  };
}

/** Runs every analytic over a graph in one call. */
export function computeAnalytics(g: ForceGraph): Analytics {
  const { betweenness, closeness } = centrality(g);
  const { community, communityCount, communitySizes } = detectCommunities(g);
  return { betweenness, closeness, community, communityCount, communitySizes };
}

/** Builds a short, specific plain-English read of the graph's structure. */
export function buildInsight(g: ForceGraph, a: Analytics): string[] {
  const n = g.nodes.length;
  const e = g.edges.length;
  if (!n) return [];
  const out: string[] = [];

  const density = n > 1 ? (e / ((n * (n - 1)) / 2)) * 100 : 0;
  const tone =
    density < 4 ? "sparse" : density < 12 ? "moderately linked" : "dense";
  out.push(
    `A ${tone} network — ${n} nodes joined by ${e} connections, ${density.toFixed(
      1,
    )}% of every link that could exist.`,
  );

  const byDegree = [...g.nodes].sort((x, y) => y.degree - x.degree);
  const top = byDegree[0];
  if (top) {
    const top3 = byDegree.slice(0, Math.min(3, n));
    const totalDeg = g.nodes.reduce((s, x) => s + x.degree, 0);
    const hubDeg = top3.reduce((s, x) => s + x.degree, 0);
    const share = totalDeg ? (hubDeg / totalDeg) * 100 : 0;
    out.push(
      `${top.id} is the most connected node with ${top.degree} links. The top ${top3.length} hubs — ${top3
        .map((x) => x.id)
        .join(", ")} — account for ${share.toFixed(0)}% of all connections.`,
    );
  }

  const bw = [...a.betweenness.entries()].sort((x, y) => y[1] - x[1]);
  if (bw[0] && bw[0][1] > 0) {
    const dominant = (bw[1]?.[1] ?? 0) < 0.66;
    out.push(
      dominant
        ? `${bw[0][0]} sits on the most shortest paths between other nodes by a clear margin — the network's main bridge and a likely single point of failure.`
        : `${bw[0][0]} carries the most traffic between distant nodes, making it a key connector.`,
    );
  }

  if (a.communityCount > 1) {
    const big = a.communitySizes.slice(0, 3).filter(Boolean);
    out.push(
      `Modularity analysis separates the graph into ${a.communityCount} communities; the largest hold ${big.join(
        ", ",
      )} nodes.`,
    );
  } else {
    out.push(
      "The graph forms a single tightly-knit community with no clear sub-groups.",
    );
  }

  const leaves = g.nodes.filter((x) => x.degree === 1).length;
  if (leaves > 0) {
    out.push(
      `${leaves} ${
        leaves === 1 ? "node sits" : "nodes sit"
      } on the periphery with just one connection.`,
    );
  }

  return out;
}
