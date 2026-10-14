"use client";
import { useState } from "react";

export type Bar = { label: string; value: number };

/** Gráfico de barras simples e acessível, com linhas de apoio, rótulos e dica ao passar o mouse/tocar. */
export default function BarChart({ data, unit, summary }: { data: Bar[]; unit: [string, string]; summary: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = max <= 4 ? max : Math.ceil(max / 4) * 4;
  const w = n * 10;
  const tip = hover !== null ? data[hover] : null;
  return (
    <figure className="bc">
      <div className="bc-plot">
        <div className="bc-y" aria-hidden="true">
          <span>{nice}</span>
          <span>{Math.round(nice / 2)}</span>
          <span>0</span>
        </div>
        <div className="bc-area">
          <svg viewBox={`0 0 ${w} 100`} preserveAspectRatio="none" role="img" aria-label={summary}>
            {[0, 50, 100].map((y) => (
              <line key={y} x1={0} x2={w} y1={y} y2={y} className="bc-grid" vectorEffect="non-scaling-stroke" />
            ))}
            {data.map((d, i) => {
              const h = d.value ? Math.max(3, (d.value / nice) * 100) : 0;
              return <rect key={i} x={i * 10 + 1.5} y={100 - h} width={7} height={h} rx={1.5} className={hover === i ? "bc-bar hot" : "bc-bar"} />;
            })}
            {data.map((_, i) => (
              <rect
                key={"h" + i}
                x={i * 10}
                y={0}
                width={10}
                height={100}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onTouchStart={() => setHover(i)}
              />
            ))}
          </svg>
          {tip && (
            <div className="bc-tip" style={{ left: `${((hover! + 0.5) / n) * 100}%` }}>
              <b>{tip.value}</b> {tip.value === 1 ? unit[0] : unit[1]}
              <span>{tip.label}</span>
            </div>
          )}
        </div>
      </div>
      <div className="bc-x" aria-hidden="true">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(n / 2)]?.label}</span>
        <span>hoje</span>
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}
