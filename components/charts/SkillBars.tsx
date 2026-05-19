"use client";

import type { SkillGroup } from "@/data/profile";
import { useInView } from "@/components/useInView";

/** Skills as an animated proficiency bar chart — reads as a data viz itself. */
export function SkillBars({ groups }: { groups: SkillGroup[] }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.18);

  return (
    <div ref={ref} className="grid gap-5 sm:grid-cols-2">
      {groups.map((g, gi) => (
        <div key={g.group} className="glass p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">{g.group}</h3>
            <span className="kicker">
              {String(gi + 1).padStart(2, "0")}
            </span>
          </div>
          <div className="space-y-4">
            {g.items.map((s, i) => (
              <div key={s.name}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-text/85">{s.name}</span>
                  <span className="font-mono tabular-nums text-muted">
                    {s.level}
                  </span>
                </div>
                <div className="h-[6px] overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: inView ? `${s.level}%` : "0%",
                      background:
                        "linear-gradient(90deg,#4c8dff,#9a6bff 70%,#3de0c2)",
                      transition: `width 1000ms cubic-bezier(.22,1,.36,1) ${
                        i * 80
                      }ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
