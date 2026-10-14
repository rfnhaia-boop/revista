"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, MessageCircle, PenLine } from "lucide-react";
import type { PostStats } from "@/lib/engagement";

const short = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);

/** Faixa que só o autor vê no próprio texto: números do pensamento e atalho para editar. */
export default function ThoughtOwnerBar({ id }: { id: string }) {
  const [s, setS] = useState<PostStats | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/community/engage?post=${id}&stats=1`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((x: PostStats) => alive && setS(x))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);
  const max = Math.max(1, ...(s?.days.map((d) => d.views) ?? [1]));
  return (
    <aside className="tv-owner glass" aria-label="Seus números neste texto">
      <div className="tv-owner-top">
        <span className="eyebrow">SÓ VOCÊ VÊ ISTO</span>
        <Link href={`/escrever/pensamento/${id}`} className="outline small">
          <PenLine size={14} /> Editar
        </Link>
      </div>
      <div className="tv-owner-body">
        <ul className="tv-owner-nums">
          <li><Eye size={16} /><b>{s?.readers ?? "–"}</b> leitores</li>
          <li><MessageCircle size={16} /><b>{s?.replies ?? "–"}</b> respostas</li>
          <li><Heart size={16} /><b>{s?.likes ?? "–"}</b> “Isso me ajudou”</li>
        </ul>
        {s && s.views > 0 && (
          <svg viewBox="0 0 300 50" preserveAspectRatio="none" className="tv-spark" role="img" aria-label={`Leituras por dia nos últimos 30 dias, ${s.views} no total.`}>
            {s.days.map((d, i) => {
              const h = Math.max(d.views ? 3 : 1, (d.views / max) * 46);
              return (
                <rect key={d.day} x={i * 10 + 1} y={48 - h} width={8} height={h} rx={2} className={d.views ? "on" : ""}>
                  <title>{`${short(d.day)}: ${d.views}`}</title>
                </rect>
              );
            })}
          </svg>
        )}
      </div>
    </aside>
  );
}
