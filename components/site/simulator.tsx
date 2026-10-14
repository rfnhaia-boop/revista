"use client";
import { useState } from "react";
import { stages } from "@/lib/content";

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Simulador de repasses. Só aparece com FEATURE_MONEY=1. */
export default function SimulatorCard() {
  const [total, setTotal] = useState(10000);
  return (
    <div className="glass info-card">
      <div className="eyebrow">SIMULADOR DE REPASSES</div>
      <h2>Recursos com destino claro.</h2>
      <label className="field">
        Valor da campanha (R$)
        <input
          type="number"
          min="100"
          max="1000000"
          value={total}
          onChange={(e) => setTotal(Math.max(0, Math.min(1000000, Number(e.target.value) || 0)))}
        />
      </label>
      <div className="money-line">
        <span>Taxa NEW simulada · 5%</span>
        <strong>{money(total * 0.05)}</strong>
      </div>
      <div className="money-line">
        <span>Destinado à pesquisa</span>
        <strong>{money(total * 0.95)}</strong>
      </div>
      <div className="repay-grid">
        {stages.map((s) => (
          <div key={s.n}>
            <span>{s.title}</span>
            <strong>{money((total * 0.95 * s.pct) / 100)}</strong>
          </div>
        ))}
      </div>
      <p className="fine">
        Exemplo de distribuição. Não inclui processamento, tributos ou custos de pareceristas. Condições serão pactuadas por projeto.
      </p>
    </div>
  );
}
