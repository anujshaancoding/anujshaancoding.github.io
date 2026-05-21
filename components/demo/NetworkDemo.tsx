"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DemoEmpty, DemoShell, ExportButton } from "./DemoShell";
import { DemoTooltip, type TooltipModel } from "./DemoTooltip";
import { NetworkControls } from "./NetworkControls";
import { parseTable, type Table } from "@/lib/csv";
import {
  buildGraph,
  DEFAULT_PHYSICS,
  networkStats,
  tableToEdges,
  tick,
  type ForceGraph,
  type ForceNode,
  type PhysicsParams,
} from "@/lib/force";
import {
  buildInsight,
  computeAnalytics,
  type Analytics,
  type Metric,
  type SizeMetric,
} from "@/lib/graph-analytics";
import { buildHtmlReport, downloadBlob, svgToPng } from "@/lib/report";
import { NETWORK_SAMPLES, type SamplePreset } from "@/lib/demo-samples";

const VB_W = 920;
const VB_H = 560;
const DEFAULT = NETWORK_SAMPLES[1];

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Distinct hues for community colouring — index 0 is the largest group. */
const COMMUNITY_COLORS = [
  "#4c8dff",
  "#3de0c2",
  "#9a6bff",
  "#ff9f5c",
  "#5cd0ff",
  "#ff6f9c",
  "#9ee35b",
  "#ffd166",
  "#c98aff",
  "#5be8b0",
];

type Cursor = { clientX: number; clientY: number };
type View = { zoom: number; panX: number; panY: number };
const IDENTITY: View = { zoom: 1, panX: 0, panY: 0 };

/** Blue→purple ramp for continuous metrics (degree, betweenness, closeness). */
const rampColor = (t: number) => {
  const a = [76, 141, 255];
  const b = [154, 107, 255];
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * clamp(t, 0, 1)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

/** Parses a file into a simulation-ready graph, or throws a clear message. */
function buildFrom(
  name: string,
  text: string,
): { table: Table; graph: ForceGraph } {
  const table = parseTable(name, text);
  if (table.headers.length < 2) {
    throw new Error("Need at least two columns: a source and a target.");
  }
  const edges = tableToEdges(table);
  if (!edges.length) {
    throw new Error(
      "No valid connections found. Expecting source and target columns.",
    );
  }
  return { table, graph: buildGraph(edges, VB_W, VB_H) };
}

export function NetworkDemo() {
  const initial = useMemo(() => {
    try {
      return buildFrom(DEFAULT.fileName, DEFAULT.csv);
    } catch {
      return null;
    }
  }, []);

  const [table, setTable] = useState<Table | null>(initial?.table ?? null);
  const [graph, setGraph] = useState<ForceGraph | null>(initial?.graph ?? null);
  const [fileName, setFileName] = useState(DEFAULT.fileName);
  const [activeSample, setActiveSample] = useState<string | null>(DEFAULT.id);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipModel | null>(null);
  const [, setFrame] = useState(0);

  // Control state.
  const [colorBy, setColorBy] = useState<Metric>("degree");
  const [sizeBy, setSizeBy] = useState<SizeMetric>("degree");
  const [minDegree, setMinDegree] = useState(1);
  const [query, setQuery] = useState("");
  const [showPhysics, setShowPhysics] = useState(false);
  const [physics, setPhysicsState] = useState<PhysicsParams>(DEFAULT_PHYSICS);
  const [view, setView] = useState<View>(IDENTITY);

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraph | null>(initial?.graph ?? null);
  const alphaRef = useRef(0);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const dragRef = useRef<ForceNode | null>(null);
  const physicsRef = useRef<PhysicsParams>(DEFAULT_PHYSICS);
  const interactionRef = useRef<"node" | "pan" | null>(null);
  const panStartRef = useRef({ vbX: 0, vbY: 0, panX: 0, panY: 0 });
  const downRef = useRef({ x: 0, y: 0, moved: false });

  const render = useCallback(() => setFrame((f) => f + 1), []);

  const run = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    const step = () => {
      const g = graphRef.current;
      if (!g) {
        runningRef.current = false;
        return;
      }
      tick(g, alphaRef.current, VB_W, VB_H, physicsRef.current);
      alphaRef.current *= 0.986;
      render();
      if (alphaRef.current > 0.015 || dragRef.current) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        runningRef.current = false;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [render]);

  const reheat = useCallback(
    (a = 0.4) => {
      alphaRef.current = Math.max(alphaRef.current, a);
      run();
    },
    [run],
  );

  // Settle the initial graph once the component mounts on the client.
  useEffect(() => {
    if (graphRef.current) {
      alphaRef.current = 1;
      run();
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [run]);

  // Native, non-passive wheel listener — lets zoom suppress page scroll.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(
        ctm.inverse(),
      );
      setView((v) => {
        const zoom = clamp(v.zoom * (ev.deltaY < 0 ? 1.16 : 1 / 1.16), 0.35, 6);
        const k = zoom / v.zoom;
        return {
          zoom,
          panX: p.x - (p.x - v.panX) * k,
          panY: p.y - (p.y - v.panY) * k,
        };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [graph]);

  // Centrality + community detection — recomputed only when the graph changes.
  const analytics = useMemo<Analytics | null>(
    () => (graph ? computeAnalytics(graph) : null),
    [graph],
  );
  const insight = useMemo(
    () => (graph && analytics ? buildInsight(graph, analytics) : []),
    [graph, analytics],
  );

  const ingest = (name: string, text: string): boolean => {
    try {
      const { table: t, graph: g } = buildFrom(name, text);
      graphRef.current = g;
      setGraph(g);
      setTable(t);
      setFileName(name);
      setError(null);
      setHover(null);
      setSelected(null);
      setTooltip(null);
      setQuery("");
      setMinDegree(1);
      setView(IDENTITY);
      alphaRef.current = 1;
      run();
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

  const maxDegree = useMemo(
    () => (graph ? graph.nodes.reduce((m, n) => Math.max(m, n.degree), 1) : 1),
    [graph],
  );
  const ranked = useMemo(() => {
    const rank = new Map<string, number>();
    const byId = new Map<string, ForceNode>();
    if (graph) {
      graph.nodes.forEach((n) => byId.set(n.id, n));
      [...graph.nodes]
        .sort((a, b) => b.degree - a.degree)
        .forEach((n, i) => rank.set(n.id, i + 1));
    }
    return { rank, byId };
  }, [graph]);
  const labelSet = useMemo(() => {
    if (!graph) return new Set<string>();
    const limit = graph.nodes.length <= 26 ? graph.nodes.length : 14;
    return new Set(
      [...graph.nodes]
        .sort((a, b) => b.degree - a.degree)
        .slice(0, limit)
        .map((n) => n.id),
    );
  }, [graph]);

  const stats = useMemo(() => {
    if (!graph) return [];
    const base = networkStats(graph);
    if (!analytics) return base;
    let bridge = "";
    let bMax = -1;
    analytics.betweenness.forEach((v, id) => {
      if (v > bMax) {
        bMax = v;
        bridge = id;
      }
    });
    return [
      ...base,
      { label: "Communities", value: String(analytics.communityCount) },
      { label: "Key bridge", value: bridge || "—" },
    ];
  }, [graph, analytics]);

  // ---- metric → visual encoding ----
  const metricNorm = useCallback(
    (n: ForceNode, m: Metric): number => {
      if (m === "betweenness") return analytics?.betweenness.get(n.id) ?? 0;
      if (m === "closeness") return analytics?.closeness.get(n.id) ?? 0;
      return maxDegree ? n.degree / maxDegree : 0;
    },
    [analytics, maxDegree],
  );
  const nodeFill = useCallback(
    (n: ForceNode): string => {
      if (colorBy === "community") {
        const c = analytics?.community.get(n.id) ?? 0;
        return COMMUNITY_COLORS[c % COMMUNITY_COLORS.length];
      }
      return rampColor(metricNorm(n, colorBy));
    },
    [analytics, colorBy, metricNorm],
  );
  const nodeRadius = (n: ForceNode): number =>
    4 + Math.sqrt(Math.max(0, metricNorm(n, sizeBy))) * 17;

  /**
   * Builds the tooltip for a node, anchored just clear of the node and
   * opened on the side opposite the bulk of its edges — so the card never
   * sits over the connections being traced.
   */
  const buildNodeTip = (n: ForceNode): TooltipModel | null => {
    const gEl = gRef.current;
    const wrap = wrapRef.current;
    const ctm = gEl?.getScreenCTM();
    if (!gEl || !wrap || !ctm) return null;
    const wr = wrap.getBoundingClientRect();
    const screen = new DOMPoint(n.x, n.y).matrixTransform(ctm);
    const nx = screen.x - wr.left;
    const ny = screen.y - wr.top;

    // Average direction the node's edges fan out toward.
    let sx = 0;
    let sy = 0;
    graph?.adjacency.get(n.id)?.forEach((id) => {
      const o = ranked.byId.get(id);
      if (o) {
        sx += o.x - n.x;
        sy += o.y - n.y;
      }
    });
    const len = Math.hypot(sx, sy);
    // Opposite of the edge flow — fall back to up-left when undefined.
    const ox = len > 0.001 ? -sx / len : -0.7;
    const oy = len > 0.001 ? -sy / len : -0.7;
    const reach = nodeRadius(n) * view.zoom + 16;

    let hubId = "";
    let hubDeg = -1;
    graph?.adjacency.get(n.id)?.forEach((id) => {
      const d = ranked.byId.get(id)?.degree ?? -1;
      if (d > hubDeg) {
        hubDeg = d;
        hubId = id;
      }
    });
    const bw = Math.round((analytics?.betweenness.get(n.id) ?? 0) * 100);
    const group = (analytics?.community.get(n.id) ?? 0) + 1;
    return {
      x: nx + ox * reach,
      y: ny + oy * reach,
      w: wr.width,
      h: wr.height,
      side: { x: ox >= 0 ? "right" : "left", y: oy >= 0 ? "down" : "up" },
      title: n.id,
      accent: nodeFill(n),
      kicker: "Graph node",
      rows: [
        { label: "Connections", value: String(n.degree), emphasis: true },
        {
          label: "Rank by degree",
          value: `#${ranked.rank.get(n.id) ?? "—"} of ${graph?.nodes.length ?? 0}`,
        },
        { label: "Betweenness", value: `${bw} / 100` },
        { label: "Community", value: `Group ${group}` },
        { label: "Hub neighbour", value: hubId ? `${hubId} · ${hubDeg}` : "—" },
      ],
    };
  };

  // ---- pointer: node drag, background pan, click-to-pin ----
  const clientToVB = (e: Cursor) => {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return null;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
  };
  const clientToWorld = (e: Cursor) => {
    const ctm = gRef.current?.getScreenCTM();
    if (!ctm) return null;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
  };

  const onNodeDown = (node: ForceNode) => (e: ReactPointerEvent) => {
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    node.fixed = true;
    node.vx = 0;
    node.vy = 0;
    dragRef.current = node;
    interactionRef.current = "node";
    downRef.current = { x: e.clientX, y: e.clientY, moved: false };
    reheat(0.5);
  };
  const onBgDown = (e: ReactPointerEvent) => {
    const vb = clientToVB(e);
    if (!vb) return;
    svgRef.current?.setPointerCapture(e.pointerId);
    interactionRef.current = "pan";
    panStartRef.current = {
      vbX: vb.x,
      vbY: vb.y,
      panX: view.panX,
      panY: view.panY,
    };
    downRef.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!interactionRef.current) return;
    if (
      Math.abs(e.clientX - downRef.current.x) > 3 ||
      Math.abs(e.clientY - downRef.current.y) > 3
    ) {
      downRef.current.moved = true;
    }
    if (interactionRef.current === "node") {
      const node = dragRef.current;
      const p = clientToWorld(e);
      if (!node || !p) return;
      node.x = clamp(p.x, 10, VB_W - 10);
      node.y = clamp(p.y, 10, VB_H - 10);
      render();
    } else {
      const vb = clientToVB(e);
      if (!vb) return;
      const s = panStartRef.current;
      setView((v) => ({
        ...v,
        panX: s.panX + (vb.x - s.vbX),
        panY: s.panY + (vb.y - s.vbY),
      }));
    }
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const kind = interactionRef.current;
    interactionRef.current = null;
    svgRef.current?.releasePointerCapture(e.pointerId);
    if (kind === "node") {
      const node = dragRef.current;
      dragRef.current = null;
      if (!node) return;
      node.fixed = false;
      // A tap that never moved is a click — toggle the pinned selection.
      if (!downRef.current.moved) {
        setSelected((s) => (s === node.id ? null : node.id));
      }
      reheat(0.2);
    } else if (kind === "pan" && !downRef.current.moved) {
      setSelected(null);
    }
  };

  // ---- viewport ----
  const zoomBy = (factor: number) => {
    setView((v) => {
      const zoom = clamp(v.zoom * factor, 0.35, 6);
      const k = zoom / v.zoom;
      const cx = VB_W / 2;
      const cy = VB_H / 2;
      return {
        zoom,
        panX: cx - (cx - v.panX) * k,
        panY: cy - (cy - v.panY) * k,
      };
    });
  };
  const fitView = () => {
    const g = graphRef.current;
    if (!g) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let any = false;
    g.nodes.forEach((n) => {
      if (n.degree < minDegree) return;
      any = true;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x);
      maxY = Math.max(maxY, n.y);
    });
    if (!any) return;
    const pad = 48;
    const bw = Math.max(maxX - minX, 1);
    const bh = Math.max(maxY - minY, 1);
    const zoom = clamp(
      Math.min(VB_W / (bw + pad * 2), VB_H / (bh + pad * 2)),
      0.35,
      6,
    );
    setView({
      zoom,
      panX: VB_W / 2 - ((minX + maxX) / 2) * zoom,
      panY: VB_H / 2 - ((minY + maxY) / 2) * zoom,
    });
  };

  const onSearchSubmit = () => {
    const g = graph;
    const q = query.trim().toLowerCase();
    if (!g || !q) return;
    const hit =
      g.nodes.find((n) => n.id.toLowerCase() === q) ??
      g.nodes.find((n) => n.id.toLowerCase().includes(q));
    if (!hit) return;
    setSelected(hit.id);
    const zoom = Math.max(view.zoom, 1.7);
    setView({
      zoom,
      panX: VB_W / 2 - hit.x * zoom,
      panY: VB_H / 2 - hit.y * zoom,
    });
  };

  const applyPhysics = (p: PhysicsParams) => {
    physicsRef.current = p;
    setPhysicsState(p);
    reheat(0.35);
  };

  const downloadReport = () => {
    if (!svgRef.current || !table) return;
    const svg = new XMLSerializer().serializeToString(svgRef.current);
    const html = buildHtmlReport({
      title: "Network Graph Analysis",
      kind: "network graph",
      fileName,
      portfolioUrl: window.location.origin,
      stats,
      visualSvg: svg,
      headers: table.headers,
      rows: table.rows,
    });
    downloadBlob("network-report.html", new Blob([html], { type: "text/html" }));
  };
  const downloadPng = async () => {
    if (!svgRef.current) return;
    try {
      downloadBlob("network-graph.png", await svgToPng(svgRef.current));
    } catch (e) {
      setError(e instanceof Error ? e.message : "PNG export failed.");
    }
  };

  // ---- derived render state ----
  const adj = graph?.adjacency;
  const activeId = hover ?? selected;
  const q = query.trim().toLowerCase();
  const matches = (id: string) => q !== "" && id.toLowerCase().includes(q);
  const inFocus = (id: string) => {
    if (activeId) return id === activeId || !!adj?.get(activeId)?.has(id);
    if (q) return matches(id);
    return true;
  };
  const visible = (n: ForceNode) => n.degree >= minDegree;
  const hiddenCount = graph
    ? graph.nodes.filter((n) => n.degree < minDegree).length
    : 0;
  const viewMoved =
    view.zoom !== 1 || view.panX !== 0 || view.panY !== 0;

  return (
    <DemoShell
      title="Network Graph"
      subtitle="Reveal the structure inside connection data. A live force-directed simulation finds the layout — search and pin nodes, colour by centrality or community, tune the physics, and read the auto-generated structural summary."
      kind="Network"
      accept=".csv,.tsv,.txt,.json"
      formatHelp={
        <>
          A row per connection with{" "}
          <code className="text-accent2">source</code> and{" "}
          <code className="text-accent2">target</code> columns, plus an optional{" "}
          <code className="text-accent2">value</code> (weight). Node size and
          colour scale with whichever metric you choose.
        </>
      }
      samples={NETWORK_SAMPLES}
      activeSample={activeSample}
      hasData={!!graph}
      fileName={fileName}
      rowCount={table?.rows.length}
      error={error}
      notice={
        graph && graph.trimmed > 0
          ? `Showing the 600 most-connected nodes — ${graph.trimmed} smaller nodes were hidden to keep the simulation smooth.`
          : null
      }
      stats={stats}
      toolbar={
        graph ? (
          <NetworkControls
            query={query}
            onQuery={setQuery}
            onSearchSubmit={onSearchSubmit}
            colorBy={colorBy}
            onColorBy={setColorBy}
            sizeBy={sizeBy}
            onSizeBy={setSizeBy}
            minDegree={minDegree}
            maxDegree={maxDegree}
            onMinDegree={setMinDegree}
            hiddenCount={hiddenCount}
            physics={physics}
            onPhysics={applyPhysics}
            onResetPhysics={() => applyPhysics(DEFAULT_PHYSICS)}
            showPhysics={showPhysics}
            onTogglePhysics={() => setShowPhysics((s) => !s)}
            onRerun={() => {
              alphaRef.current = 1;
              run();
            }}
          />
        ) : null
      }
      exportSlot={
        <>
          <ExportButton onClick={downloadReport}>
            Download report (HTML)
          </ExportButton>
          <ExportButton onClick={downloadPng}>Download chart (PNG)</ExportButton>
        </>
      }
      onSelectSample={onSelectSample}
      onLoad={onUpload}
      onError={setError}
    >
      {graph ? (
        <>
          <div ref={wrapRef} className="relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              className="block h-auto w-full touch-none"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              role="img"
              aria-label="Force-directed network graph"
            >
              <rect
                width={VB_W}
                height={VB_H}
                fill="#0b1018"
                rx={8}
                onPointerDown={onBgDown}
                className="cursor-grab active:cursor-grabbing"
              />
              <g
                ref={gRef}
                transform={`translate(${view.panX} ${view.panY}) scale(${view.zoom})`}
              >
                {graph.edges.map((e, i) => {
                  if (!visible(e.s) || !visible(e.t)) return null;
                  const on =
                    !activeId ||
                    e.s.id === activeId ||
                    e.t.id === activeId;
                  return (
                    <line
                      key={i}
                      x1={e.s.x}
                      y1={e.s.y}
                      x2={e.t.x}
                      y2={e.t.y}
                      stroke={on && activeId ? "#4c8dff" : "#ffffff"}
                      strokeOpacity={on ? (activeId ? 0.55 : 0.12) : 0.04}
                      strokeWidth={on && activeId ? 1.6 : 1}
                    />
                  );
                })}
                {activeId &&
                  graph.edges.map((e, i) => {
                    if (!visible(e.s) || !visible(e.t)) return null;
                    // A neighbour edge of the active node: send packets along
                    // it, always flowing outward from that node.
                    const fromS = e.s.id === activeId;
                    if (!fromS && e.t.id !== activeId) return null;
                    return (
                      <line
                        key={`flow-${i}`}
                        x1={e.s.x}
                        y1={e.s.y}
                        x2={e.t.x}
                        y2={e.t.y}
                        stroke="#3de0c2"
                        strokeWidth={2}
                        strokeOpacity={0.9}
                        strokeLinecap="round"
                        strokeDasharray="2 14"
                        className="network-flow"
                        style={{
                          animationDirection: fromS ? "normal" : "reverse",
                        }}
                        pointerEvents="none"
                      />
                    );
                  })}
                {graph.nodes.map((n) => {
                  if (!visible(n)) return null;
                  const r = nodeRadius(n);
                  const focused = inFocus(n.id);
                  const isActive = n.id === activeId;
                  const isMatch = matches(n.id);
                  const right = n.x < VB_W - 96;
                  return (
                    <g key={n.id}>
                      {isActive && (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={r + 6}
                          fill="none"
                          stroke="#3de0c2"
                          strokeOpacity={0.35}
                          strokeWidth={2}
                        />
                      )}
                      {isMatch && !isActive && (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={r + 5}
                          fill="none"
                          stroke="#3de0c2"
                          strokeOpacity={0.7}
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                        />
                      )}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={r}
                        fill={nodeFill(n)}
                        opacity={focused ? 1 : 0.16}
                        stroke={isActive ? "#3de0c2" : "#0b1018"}
                        strokeWidth={isActive ? 2.2 : 1.5}
                        style={{ cursor: "grab" }}
                        onPointerDown={onNodeDown(n)}
                        onMouseEnter={() => {
                          setHover(n.id);
                          setTooltip(buildNodeTip(n));
                        }}
                        onMouseLeave={() => {
                          setHover(null);
                          setTooltip(null);
                        }}
                      />
                      {(labelSet.has(n.id) ||
                        isActive ||
                        (activeId && focused) ||
                        isMatch) && (
                        <text
                          x={right ? n.x + r + 4 : n.x - r - 4}
                          y={n.y}
                          textAnchor={right ? "start" : "end"}
                          dominantBaseline="middle"
                          fontSize={11}
                          fill="#dfe4f0"
                          fillOpacity={focused ? 1 : 0.25}
                          stroke="#0b1018"
                          strokeWidth={3.5}
                          paintOrder="stroke"
                          pointerEvents="none"
                        >
                          {n.id}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* zoom controls */}
            <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-lg border border-white/[0.1] bg-bg/80 backdrop-blur-md">
              <ZoomButton label="Zoom in" onClick={() => zoomBy(1.3)}>
                <path d="M12 5v14M5 12h14" />
              </ZoomButton>
              <ZoomButton
                label="Zoom out"
                onClick={() => zoomBy(1 / 1.3)}
                divided
              >
                <path d="M5 12h14" />
              </ZoomButton>
              <ZoomButton label="Fit to view" onClick={fitView} divided>
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </ZoomButton>
            </div>

            {viewMoved && (
              <button
                onClick={() => setView(IDENTITY)}
                className="absolute left-3 top-3 rounded-lg border border-white/[0.1] bg-bg/80 px-2.5 py-1 text-[11px] font-medium text-muted backdrop-blur-md transition-colors hover:border-accent/50 hover:text-text"
              >
                Reset view
              </button>
            )}

            <DemoTooltip model={tooltip} />
          </div>

          {insight.length > 0 && (
            <div className="mt-3 border-t border-white/[0.07] pt-3">
              <div className="mb-2 flex items-center gap-1.5">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-accent3"
                  aria-hidden
                >
                  <path
                    d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                  Automated insight
                </span>
              </div>
              <ul className="space-y-1.5">
                {insight.map((line, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-xs leading-relaxed text-muted"
                  >
                    <span
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent3"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <DemoEmpty hint="Pick a sample size on the left, or upload an edge list with source and target columns." />
      )}
    </DemoShell>
  );
}

/** One button in the zoom-control cluster. */
function ZoomButton({
  label,
  onClick,
  divided,
  children,
}: {
  label: string;
  onClick: () => void;
  divided?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center text-muted transition-colors hover:bg-accent/15 hover:text-text ${
        divided ? "border-t border-white/[0.1]" : ""
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    </button>
  );
}
