"use client";

import { useEffect, useRef } from "react";

/**
 * Signature hero: a slow, layered streaming-data field rendered to canvas.
 * Soft dot grid + three flowing series with glow + drifting particles that
 * ride the lead curve. Gently parallaxes toward the cursor. The first thing
 * a visitor sees is, literally, a running data visualization.
 * Respects prefers-reduced-motion (one static frame).
 */
export function HeroViz() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // very slow drift
    const series = [
      { color: "#4c8dff", phase: 0, amp: 0.5, speed: 0.0009, yo: 0.52 },
      { color: "#9a6bff", phase: 2.1, amp: 0.4, speed: 0.0006, yo: 0.58 },
      { color: "#3de0c2", phase: 4.3, amp: 0.3, speed: 0.0012, yo: 0.46 },
    ];

    const rnd = (n: number) => {
      let s = n * 9301 + 49297;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    };
    const r = rnd(7);
    const particles = Array.from({ length: 26 }, () => ({
      x: r(),
      spd: 0.000018 + r() * 0.00004,
      size: 0.6 + r() * 1.8,
    }));

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const onMove = (e: MouseEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const curveY = (
      s: (typeof series)[number],
      k: number,
      t: number,
      mx: number,
    ) =>
      h * s.yo +
      Math.sin(k * 5 + s.phase + t * s.speed + mx * 0.6) * h * s.amp * 0.4 +
      Math.sin(k * 11 + s.phase * 1.5 + t * s.speed * 1.6) * h * s.amp * 0.16;

    const draw = (t: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const px = (mouse.x - 0.5) * 26; // parallax px
      const mInf = mouse.x - 0.5;

      ctx.clearRect(0, 0, w, h);

      // soft dot grid
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      const gap = 34;
      for (let gx = (px % gap) + gap; gx < w; gx += gap) {
        for (let gy = gap; gy < h; gy += gap) {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // cursor light
      const cg = ctx.createRadialGradient(
        mouse.x * w,
        mouse.y * h,
        0,
        mouse.x * w,
        mouse.y * h,
        260,
      );
      cg.addColorStop(0, "rgba(76,141,255,0.10)");
      cg.addColorStop(1, "rgba(76,141,255,0)");
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, w, h);

      series.forEach((s, si) => {
        const pts: [number, number][] = [];
        const step = 12;
        for (let x = -step; x <= w + step; x += step) {
          const k = x / w;
          pts.push([x + px * (0.4 + si * 0.3), curveY(s, k, t, mInf)]);
        }

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, `${s.color}2e`);
        grad.addColorStop(1, `${s.color}00`);
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        pts.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.lineTo(w + 20, h);
        ctx.lineTo(-20, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        pts.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.9;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // particles ride the lead (first) series
        if (si === 0) {
          particles.forEach((p) => {
            if (!reduced) p.x += p.spd * 16.7;
            if (p.x > 1) p.x -= 1;
            const x = p.x * w;
            const y = curveY(s, p.x, t, mInf);
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(232,237,247,0.85)";
            ctx.fill();
          });
        }
      });

      // bottom fade into page bg
      const fade = ctx.createLinearGradient(0, h - 160, 0, h);
      fade.addColorStop(0, "rgba(7,10,18,0)");
      fade.addColorStop(1, "rgba(7,10,18,1)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, h - 160, w, 160);
    };

    let raf = 0;
    if (reduced) {
      draw(0);
    } else {
      const loop = (t: number) => {
        draw(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
