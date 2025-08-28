// components/RevenueChart.tsx
"use client";

import { useMemo } from "react";

type Pt = { date: string; total: number };

export default function RevenueChart({ points }: { points: Pt[] }) {
  // normalize to 0..1
  const { path, height, width } = useMemo(() => {
    const w = 720, h = 260, pad = 16;
    if (!points.length) return { path: "", width: w, height: h };

    const xs = points.map((_, i) => i);
    const ys = points.map(p => p.total);
    const maxY = Math.max(1, ...ys);
    const stepX = (w - pad * 2) / Math.max(1, points.length - 1);

    const toX = (i: number) => pad + i * stepX;
    const toY = (v: number) => h - pad - (v / maxY) * (h - pad * 2);

    let d = "";
    points.forEach((p, i) => {
      const x = toX(i), y = toY(p.total);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    // area fill
    const lastX = toX(points.length - 1);
    const base = ` L ${lastX} ${h - pad} L ${pad} ${h - pad} Z`;
    return { path: d + base, width: w, height: h };
  }, [points]);

  const strokePath = useMemo(() => {
    if (!points.length) return "";
    const w = 720, h = 260, pad = 16;
    const ys = points.map(p => p.total);
    const maxY = Math.max(1, ...ys);
    const stepX = (w - pad * 2) / Math.max(1, points.length - 1);
    const toX = (i: number) => pad + i * stepX;
    const toY = (v: number) => h - pad - (v / maxY) * (h - pad * 2);
    return points.map((p, i) => `${i ? "L" : "M"} ${toX(i)} ${toY(p.total)}`).join(" ");
  }, [points]);

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="min-w-[720px]">
        {/* area */}
        <path d={path} fill="rgba(59, 130, 246, 0.15)" />
        {/* line */}
        <path d={strokePath} fill="none" stroke="rgb(59, 130, 246)" strokeWidth="3" />
      </svg>
    </div>
  );
}
