import { ChartNoAxesCombined } from "lucide-react";
import PageHead from "@/components/site/page-head";
import { moneyEnabled } from "@/lib/features";
import { observatoryStats } from "@/lib/public-data";

export const metadata = {
  title: "Observatório · Revista NEW",
  description: "Números públicos da plataforma e o percurso de uma pesquisa, da pergunta ao resultado.",
};

export default async function Page() {
  const s = await observatoryStats();
  const money = moneyEnabled();
  const steps = [
    ["Pergunta registrada", "Uma hipótese clara, um orçamento estimado e um protocolo previsto."],
    ...(money ? [["Financiamento", "Arrecadação, taxa, custos e saldo por campanha."]] : []),
    ["Desenvolvimento", "Entregas e atualizações enviadas pelo pesquisador."],
    ["Resultado público", "Relatório, limitações, revisão e prestação de contas."],
  ];
  return (
    <>
      <PageHead
        eyebrow="NEW OBSERVATÓRIO"
        title="O caminho também é conhecimento."
        text="Números públicos da plataforma e o percurso de uma pesquisa, com execução e resultados em registros separados."
      />
      <div className="stats-grid">
        {[
          ["Artigos publicados", s.articles],
          ["Autores com Caderno", s.authors],
          ["Textos nos Cadernos", s.notebooks],
          ["Perguntas da comunidade", s.questions],
        ].map(([l, v]) => (
          <div className="stat glass" key={String(l)}>
            <span>{l}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <div className="split">
        <div className="glass info-card">
          <div className="section-heading">
            <h2>Trajetória das pesquisas</h2>
            <span className="type-label">Como funciona</span>
          </div>
          <div className="timeline">
            {steps.map(([t, d], i) => (
              <div className="timeline-row" key={t}>
                <span>{i + 1}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass info-card">
          <ChartNoAxesCombined />
          <h2>Resultados não cabem em “sucesso” ou “fracasso”.</h2>
          {[
            "Evidências compatíveis com a hipótese",
            "Evidências contrárias à hipótese",
            "Resultado inconclusivo",
            "Execução interrompida ou documentação pendente",
          ].map((t) => (
            <div className="result-row" key={t}>
              {t}
            </div>
          ))}
          <p className="fine">
            Os números acima contam apenas conteúdo já público. Envios e rascunhos privados não entram na contagem.
          </p>
        </div>
      </div>
    </>
  );
}
