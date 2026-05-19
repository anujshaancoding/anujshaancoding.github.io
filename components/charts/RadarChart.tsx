"use client";

import { useInView } from "@/components/useInView";

type Axis = { axis: string; value: number };

/** Signature competency radar — animates open when scrolled into view. */
export function RadarChart({ data }: { data: Axis[] }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.35);
  const size = 320;
  const c = size / 2;
  const rMax = c - 54;
  const n = data.length;

  const pt = (i: number, frac: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(a) * rMax * frac, c + Math.sin(a) * rMax * frac];
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const polygon = (frac: (i: number) => number) =>
    data
      .map((_, i) => {
        const [x, y] = pt(i, frac(i));
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const shape = polygon((i) => (inView ? data[i].value / 100 : 0));

  return (
    <div ref={ref} className="flex justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-auto w-full max-w-[340px]"
        role="img"
        aria-label="Core competency radar"
      >
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4c8dff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#9a6bff" stopOpacity="0.18" />
          </radialGradient>
        </defs>

        {rings.map((rg) => (
          <polygon
            key={rg}
            points={polygon(() => rg)}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        ))}

        {data.map((d, i) => {
          const [x, y] = pt(i, 1);
          const [lx, ly] = pt(i, 1.22);
          return (
            <g key={d.axis}>
              <line
                x1={c}
                y1={c}
                x2={x}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
              />
              <text
                x={lx}
                y={ly}
                textAnchor={
                  Math.abs(lx - c) < 6 ? "middle" : lx > c ? "start" : "end"
                }
                dominantBaseline="middle"
                fontSize={10.5}
                fontFamily="var(--font-mono), monospace"
                fill="#8a93a6"
              >
                {d.axis}
              </text>
            </g>
          );
        })}

        <polygon
          points={shape}
          fill="url(#radarFill)"
          stroke="#4c8dff"
          strokeWidth={2}
          strokeLinejoin="round"
          style={{
            transition: "all 1100ms cubic-bezier(.22,1,.36,1)",
            filter: "drop-shadow(0 0 10px rgba(76,141,255,0.45))",
          }}
        />

        {data.map((d, i) => {
          const [x, y] = pt(i, inView ? d.value / 100 : 0);
          return (
            <circle
              key={d.axis}
              cx={x}
              cy={y}
              r={3.5}
              fill="#E8EDF7"
              style={{ transition: "all 1100ms cubic-bezier(.22,1,.36,1)" }}
            />
          );
        })}
      </svg>
    </div>
  );
}
